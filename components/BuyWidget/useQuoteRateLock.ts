"use client";

import { useEffect, useRef, useState } from "react";
import {
  QUOTE_UI_LOCK_SECONDS,
  shouldRefreshRateLock,
  tickRateLockSeconds,
} from "@/lib/quote-rate-lock";

export function useQuoteRateLock({
  quoteId,
  enabled,
  paused,
  onRefresh,
}: {
  quoteId: string | null;
  enabled: boolean;
  paused: boolean;
  onRefresh: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const lastQuoteId = useRef<string | null>(null);

  useEffect(() => {
    if (!quoteId) {
      lastQuoteId.current = null;
      setSeconds(0);
      return;
    }
    if (quoteId !== lastQuoteId.current) {
      lastQuoteId.current = quoteId;
      setSeconds(QUOTE_UI_LOCK_SECONDS);
    }
  }, [quoteId]);

  useEffect(() => {
    if (!enabled || !quoteId) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (shouldRefreshRateLock(prev, paused)) {
          onRefreshRef.current();
        }
        return tickRateLockSeconds(prev, paused);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, quoteId, paused]);

  return seconds;
}