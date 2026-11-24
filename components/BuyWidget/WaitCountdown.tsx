"use client";

import { useEffect, useState } from "react";
import {
  WAIT_TOTAL_MS,
  formatMmSs,
  waitProgress,
  type WaitPhase,
} from "@/lib/wait-phases";

type Props = {
  startedAt: number;
  onTimeout?: () => void;
  /** Soft copy while MoMo prompt / delivery is in flight */
  mode?: "awaiting" | "delivering";
};

const COPY: Record<
  WaitPhase,
  { awaiting: { title: string; body: string }; delivering: { title: string; body: string } }
> = {
  1: {
    awaiting: {
      title: "Approve the payment",
      body: "Approve the prompt on your phone, then hang tight while we confirm it.",
    },
    delivering: {
      title: "Payment received",
      body: "We’re sending it to your wallet.",
    },
  },
  2: {
    awaiting: {
      title: "Still waiting on payment",
      body: "This is taking a bit longer. Keep the MoMo prompt open — we’re still checking.",
    },
    delivering: {
      title: "Still delivering",
      body: "Delivery is taking longer than usual. We’re still on it.",
    },
  },
  3: {
    awaiting: {
      title: "Still processing",
      body: "This is taking longer than expected.",
    },
    delivering: {
      title: "Still processing",
      body: "This is taking longer than expected.",
    },
  },
};

export function WaitCountdown(props: Props) {
  const mode = props.mode ?? "awaiting";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const progress = waitProgress(props.startedAt, now);
  const onTimeout = props.onTimeout;

  useEffect(() => {
    if (progress.timedOut) onTimeout?.();
  }, [progress.timedOut, onTimeout]);

  if (progress.timedOut) return null;

  const copy = COPY[progress.phase][mode];
  const pct = Math.min(
    100,
    (progress.elapsed / WAIT_TOTAL_MS) * 100,
  );

  return (
    <div className="space-y-4 text-center">
      <div>
        <p className="font-numbers text-4xl font-extrabold tracking-tight tabular-nums">
          {formatMmSs(progress.remainingMs)}
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mp-text-muted)] mt-1">
          {progress.phase === 1 ? "Time left" : "Taking longer"}
        </p>
      </div>
      <div>
        <h2 className="font-heading text-xl font-bold">{copy.title}</h2>
        <p className="text-sm text-[var(--mp-text-muted)] mt-2">{copy.body}</p>
      </div>
      <div
        className="h-2 rounded-full bg-[var(--mp-subcard)] overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="h-full bg-[var(--mp-button-bg)] rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
