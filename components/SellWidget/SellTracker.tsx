"use client";

import { useEffect, useState, type ReactNode } from "react";
import { OrderProgress, TrackOrderLink, type ProgressStep } from "@/components/OrderProgress";
import { Receipt } from "@/components/Receipt";
import type { OrderReceipt } from "@/lib/morapay/receipt";

const POLL_MS = 6000;

export function sellSteps(phase: OrderReceipt["phase"], ticker: string): ProgressStep[] {
  const paying = phase === "delivering" || phase === "delayed";
  return [
    { label: paying ? `${ticker} received` : `Waiting for your ${ticker}`, state: paying ? "done" : "active" },
    { label: "Paying you out", state: paying ? "active" : "todo" },
  ];
}

/** Deposit instructions, then live status, then the payout receipt. */
export function SellTracker({
  orderRef,
  ticker,
  children,
}: {
  orderRef: string;
  ticker: string;
  children: ReactNode;
}) {
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const j = await (await fetch(`/api/orders/${encodeURIComponent(orderRef)}`)).json();
        if (cancelled) return;
        if (j.success && j.data.receipt) {
          setReceipt(j.data.receipt);
          setMessage(j.data.message ?? null);
          if (["completed", "failed", "cancelled"].includes(j.data.phase)) return;
        }
      } catch {
        if (cancelled) return;
      }
      timer = setTimeout(() => void tick(), POLL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderRef]);

  const phase = receipt?.phase ?? "in_progress";
  if (receipt && phase === "completed") return <Receipt receipt={receipt} />;

  if (phase === "failed" || phase === "cancelled") {
    return (
      <div className="card p-5 space-y-3" role="alert">
        <h2 className="font-heading text-xl font-bold">
          {phase === "cancelled" ? "Order cancelled" : "Order failed"}
        </h2>
        <p className="text-sm">
          {message ?? `If you already sent ${ticker}, contact support with this reference. Don't send more.`}
        </p>
        <p className="font-mono text-xs break-all">{orderRef}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {phase === "in_progress" ? children : null}
      <div className="card p-5 space-y-3">
        <OrderProgress steps={sellSteps(phase, ticker)} />
        <p className="text-sm text-center text-[var(--mp-text-muted)]">
          This updates by itself. You can close this page.
        </p>
        <TrackOrderLink orderRef={orderRef} />
      </div>
    </div>
  );
}
