// Centralized admin audit log. Every admin-side mutation should call `audit(...)`
// so the /admin/audit page can render a complete, filterable history.
// Persisted via zustand `persist` so the log survives refreshes and tab switches.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth";

export type AuditActorRole = "admin" | "system";

export interface AuditEntry {
  id: string;
  actor: string;
  actorRole: AuditActorRole;
  action: string;
  entity: string;
  entityId: string;
  meta?: string;
  createdAt: string;
}

interface AuditState {
  entries: AuditEntry[];
  log: (e: Omit<AuditEntry, "id" | "createdAt">) => void;
  clear: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      entries: [],
      log: (e) =>
        set((s) => ({
          entries: [
            {
              ...e,
              id: `AU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: new Date().toISOString(),
            },
            ...s.entries,
          ].slice(0, 1000),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "cm-audit-log" },
  ),
);

type AuditInput = Omit<AuditEntry, "id" | "createdAt" | "actor" | "actorRole"> &
  Partial<Pick<AuditEntry, "actor" | "actorRole">>;

/** Non-hook access for mutations. Defaults actor to the current admin. */
export const audit = (e: AuditInput) => {
  const auth = useAuthStore.getState();
  useAuditStore.getState().log({
    actor: e.actor ?? auth.name ?? "Admin",
    actorRole: e.actorRole ?? (auth.role === "admin" ? "admin" : "system"),
    action: e.action,
    entity: e.entity,
    entityId: e.entityId,
    meta: e.meta,
  });
};

export const AUDIT_ENTITY_LABELS_AR: Record<string, string> = {
  user: "مستخدم",
  agency: "معرض",
  listing: "إعلان",
  escrow: "ضمان",
  dispute: "نزاع",
  withdrawal: "طلب سحب",
  kyc: "توثيق هوية",
};
