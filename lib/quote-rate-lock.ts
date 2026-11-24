/** UI countdown for onramp quotes (Morapay app uses 30s, not server expiry). */
export const QUOTE_UI_LOCK_SECONDS = 30;

export function rateLockSecondsForNewQuote(): number {
  return QUOTE_UI_LOCK_SECONDS;
}

export function tickRateLockSeconds(remaining: number, paused: boolean): number {
  if (remaining <= 0) return 0;
  if (paused) return remaining;
  return remaining - 1;
}

export function shouldRefreshRateLock(remaining: number, paused: boolean): boolean {
  return !paused && remaining === 1;
}