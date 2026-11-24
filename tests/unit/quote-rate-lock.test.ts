import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  QUOTE_UI_LOCK_SECONDS,
  rateLockSecondsForNewQuote,
  shouldRefreshRateLock,
  tickRateLockSeconds,
} from "@/lib/quote-rate-lock";
import { useQuoteRateLock } from "@/components/BuyWidget/useQuoteRateLock";

describe("quote-rate-lock helpers", () => {
  it("starts at 30 seconds for a new quote", () => {
    expect(rateLockSecondsForNewQuote()).toBe(30);
    expect(QUOTE_UI_LOCK_SECONDS).toBe(30);
  });

  it("ticks down each second when not paused", () => {
    expect(tickRateLockSeconds(30, false)).toBe(29);
    expect(tickRateLockSeconds(1, false)).toBe(0);
    expect(tickRateLockSeconds(0, false)).toBe(0);
  });

  it("does not tick when paused", () => {
    expect(tickRateLockSeconds(15, true)).toBe(15);
  });

  it("refreshes when reaching the last second", () => {
    expect(shouldRefreshRateLock(1, false)).toBe(true);
    expect(shouldRefreshRateLock(2, false)).toBe(false);
    expect(shouldRefreshRateLock(1, true)).toBe(false);
  });
});

describe("useQuoteRateLock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down and refreshes at zero, then restarts on new quote", () => {
    const onRefresh = vi.fn();
    const { result, rerender } = renderHook(
      (props) => useQuoteRateLock(props),
      {
        initialProps: {
          quoteId: "q1",
          enabled: true,
          paused: false,
          onRefresh,
        },
      },
    );

    expect(result.current).toBe(30);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(29);

    act(() => {
      vi.advanceTimersByTime(28_000);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(0);

    rerender({
      quoteId: "q2",
      enabled: true,
      paused: false,
      onRefresh,
    });
    expect(result.current).toBe(30);
  });

  it("pauses countdown and refresh while paused", () => {
    const onRefresh = vi.fn();
    const { result, rerender } = renderHook(
      (props) => useQuoteRateLock(props),
      {
        initialProps: {
          quoteId: "q1",
          enabled: true,
          paused: true,
          onRefresh,
        },
      },
    );

    expect(result.current).toBe(30);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(30);
    expect(onRefresh).not.toHaveBeenCalled();

    rerender({
      quoteId: "q1",
      enabled: true,
      paused: false,
      onRefresh,
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(29);
  });
});