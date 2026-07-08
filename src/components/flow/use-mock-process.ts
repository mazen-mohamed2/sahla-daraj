import { useCallback, useRef, useState } from "react";

export type ProcessStatus = "idle" | "processing" | "success" | "error";

/**
 * Simulates a network operation with realistic latency and a chance of
 * transient failure. The first attempt may fail (10% by default). Retries
 * always succeed so the user is never trapped.
 */
export function useMockProcess() {
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  const run = useCallback(
    async (
      task?: () => Promise<void> | void,
      opts: { failureRate?: number; minMs?: number; maxMs?: number } = {},
    ) => {
      const { failureRate = 0.08, minMs = 900, maxMs = 1600 } = opts;
      setStatus("processing");
      setError(null);
      attemptsRef.current += 1;
      const wait = Math.floor(minMs + Math.random() * (maxMs - minMs));
      await new Promise((r) => setTimeout(r, wait));
      // Only first attempt can fail
      if (attemptsRef.current === 1 && Math.random() < failureRate) {
        setStatus("error");
        setError("تعذّر إتمام العملية. يرجى المحاولة مرة أخرى.");
        return false;
      }
      try {
        await task?.();
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
        return false;
      }
      setStatus("success");
      return true;
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    attemptsRef.current = 0;
  }, []);

  return { status, error, run, reset };
}
