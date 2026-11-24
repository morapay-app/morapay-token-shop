"use client";

import { useEffect, useState } from "react";
import { Receipt } from "@/components/Receipt";
import type { OrderReceipt } from "@/lib/morapay/receipt";
import type { RampPhase } from "@/lib/morapay/status";

const LABEL: Record<RampPhase, string> = {
  in_progress: "Waiting for payment",
  delivering: "Payment received, delivering",
  completed: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
  delayed: "Delivery delayed",
};

const FINAL: RampPhase[] = ["completed", "failed", "cancelled"];

/** The wallet is known only on the device that placed the order; the server never returns it. */
function walletFor(orderRef: string): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem("mp_order") ?? "null") as {
      ref?: string;
      wallet?: string;
    } | null;
    return saved?.ref === orderRef ? (saved.wallet ?? null) : null;
  } catch {
    return null;
  }
}

export function OrderStatusClient({ orderRef }: { orderRef: string }) {
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const j = await (await fetch(`/api/orders/${encodeURIComponent(orderRef)}`)).json();
        if (cancelled) return;
        if (!j.success) {
          setError(j.message ?? "Order not found.");
          return;
        }
        setWallet(walletFor(orderRef));
        setError(null);
        setReceipt(j.data.receipt);
        setMessage(j.data.message ?? null);
        if (FINAL.includes(j.data.phase)) return;
      } catch {
        if (cancelled) return;
      }
      timer = setTimeout(() => void tick(), 5000);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderRef]);

  if (error) {
    return (
      <div className="card p-5">
        <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
          {error}
        </p>
      </div>
    );
  }
  if (!receipt) return <div className="card p-6 skeleton h-40" aria-label="Loading order" />;
  if (receipt.phase === "completed") return <Receipt receipt={receipt} wallet={wallet} />;

  return (
    <div className="card p-5 space-y-2">
      <p className="font-heading text-xl font-bold">{LABEL[receipt.phase]}</p>
      {message ? <p className="text-sm text-[var(--mp-text-muted)]">{message}</p> : null}
      {receipt.paid ? (
        <p className="text-sm">
          {receipt.paid.amount} {receipt.paid.currency}
          {receipt.received ? ` → ≈ ${receipt.received.amount} ${receipt.received.currency}` : ""}
        </p>
      ) : null}
      <p className="font-mono text-xs break-all text-[var(--mp-text-muted)]">{receipt.ref}</p>
    </div>
  );
}
