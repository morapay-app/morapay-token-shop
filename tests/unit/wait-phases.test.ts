import { describe, expect, it } from "vitest";
import {
  WAIT_PHASE1_MS,
  WAIT_TOTAL_MS,
  formatMmSs,
  waitProgress,
} from "@/lib/wait-phases";

describe("waitProgress", () => {
  const start = 1_000_000;

  it("is phase 1 for the first 4 minutes", () => {
    const p = waitProgress(start, start + 60_000);
    expect(p.phase).toBe(1);
    expect(p.timedOut).toBe(false);
    expect(p.remainingMs).toBe(WAIT_PHASE1_MS - 60_000);
  });

  it("moves to a 7-minute phase 2 after 4 minutes", () => {
    const p = waitProgress(start, start + WAIT_PHASE1_MS + 30_000);
    expect(p.phase).toBe(2);
    expect(p.remainingMs).toBe(WAIT_TOTAL_MS - WAIT_PHASE1_MS - 30_000);
  });

  it("times out after 11 minutes", () => {
    const p = waitProgress(start, start + WAIT_TOTAL_MS);
    expect(p.phase).toBe(3);
    expect(p.timedOut).toBe(true);
    expect(p.remainingMs).toBe(0);
  });
});

describe("formatMmSs", () => {
  it("pads seconds", () => {
    expect(formatMmSs(65_000)).toBe("1:05");
    expect(formatMmSs(4 * 60_000)).toBe("4:00");
  });
});
