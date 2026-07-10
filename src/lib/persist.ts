// Lightweight localStorage persistence for TanStack Query slices and
// arbitrary React state. This is the single source of truth for the
// wallet + escrow domain — the query cache is only a live view of it.

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

const NS = "cm-persist:";
const QK_PREFIX = NS + "qk:";

const keyToString = (k: QueryKey) => JSON.stringify(k);
const storageKeyFor = (k: QueryKey) => QK_PREFIX + keyToString(k);

export function loadPersisted<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function savePersisted<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* ignore quota / serialization errors */
  }
}

/**
 * Attach persistence to a QueryClient for the given query keys.
 * - Hydrates each key from localStorage into the cache on startup.
 * - Mirrors any subsequent cache writes back to localStorage.
 * - Listens for cross-tab `storage` events and syncs the cache so a
 *   second tab always reflects the latest persisted state.
 */
export function attachQueryPersistence(qc: QueryClient, keys: QueryKey[]): () => void {
  if (typeof window === "undefined") return () => {};
  const tracked = new Set(keys.map(keyToString));

  // Hydrate cache from localStorage before any queryFn runs.
  for (const k of keys) {
    try {
      const raw = window.localStorage.getItem(storageKeyFor(k));
      if (raw != null) qc.setQueryData(k, JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }

  const unsub = qc.getQueryCache().subscribe((event) => {
    if (event.type !== "updated") return;
    const qk = event.query.queryKey;
    if (!tracked.has(keyToString(qk))) return;
    const data = event.query.state.data;
    if (data === undefined) return;
    try {
      window.localStorage.setItem(storageKeyFor(qk), JSON.stringify(data));
    } catch {
      /* ignore */
    }
  });

  const onStorage = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith(QK_PREFIX)) return;
    for (const k of keys) {
      if (e.key === storageKeyFor(k)) {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : undefined;
          qc.setQueryData(k, next);
        } catch {
          /* ignore */
        }
        break;
      }
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    unsub();
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * React state hook backed by localStorage. Cross-tab safe.
 */
export function usePersistedState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState<T>(() => loadPersisted<T>(key, fallbackRef.current));

  useEffect(() => {
    savePersisted(key, value);
  }, [key, value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== NS + key) return;
      try {
        setValue(e.newValue ? (JSON.parse(e.newValue) as T) : fallbackRef.current);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const update = useCallback((v: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof v === "function" ? (v as (p: T) => T)(prev) : v));
  }, []);

  return [value, update];
}

export const PERSIST_KEYS = {
  walletBalance: ["wallet-balance"] as const,
  walletTx: ["wallet-tx"] as const,
  escrows: ["escrows"] as const,
  reviews: ["reviews"] as const,
};
