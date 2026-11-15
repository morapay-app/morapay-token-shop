/** Post-approval wait: 4 min, then +7 min, support only after 11 min total. */
export const WAIT_PHASE1_MS = 4 * 60_000;
export const WAIT_PHASE2_MS = 7 * 60_000;
export const WAIT_TOTAL_MS = WAIT_PHASE1_MS + WAIT_PHASE2_MS;

export type WaitPhase = 1 | 2 | 3;

export function waitProgress(startedAt: number, now = Date.now()) {
  const elapsed = Math.max(0, now - startedAt);
  if (elapsed >= WAIT_TOTAL_MS) {
    return {
      phase: 3 as WaitPhase,
      remainingMs: 0,
      timedOut: true,
      elapsed,
    };
  }
  if (elapsed >= WAIT_PHASE1_MS) {
    return {
      phase: 2 as WaitPhase,
      remainingMs: WAIT_TOTAL_MS - elapsed,
      timedOut: false,
      elapsed,
    };
  }
  return {
    phase: 1 as WaitPhase,
    remainingMs: WAIT_PHASE1_MS - elapsed,
    timedOut: false,
    elapsed,
  };
}

export function formatMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
