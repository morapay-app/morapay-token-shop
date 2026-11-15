"use client";

import { useEffect, useState } from "react";

export function OrderStatusClient({ orderRef }: { orderRef: string }) {
  const [wallet, setWallet] = useState("");
  const [phase, setPhase] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mp_order");
      if (raw) {
        const parsed = JSON.parse(raw) as { ref?: string; wallet?: string };
        if (parsed.wallet) setWallet(parsed.wallet);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      void fetch(
        `/api/orders/${encodeURIComponent(orderRef)}?wallet_address=${encodeURIComponent(wallet)}`,
      )
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          if (!j.success) {
            setError(j.message);
            return;
          }
          setPhase(j.data.phase);
          setExplorerUrl(j.data.explorerUrl ?? null);
          setMessage(j.data.message ?? null);
          if (
            j.data.phase !== "completed" &&
            j.data.phase !== "failed" &&
            j.data.phase !== "cancelled"
          ) {
            timer = setTimeout(tick, 4000);
          }
        })
        .catch(() => {
          if (!cancelled) timer = setTimeout(tick, 4000);
        });
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderRef, wallet]);

  return (
    <div className="card p-5 space-y-4">
      <p className="font-mono text-sm break-all">{orderRef}</p>
      {!wallet && (
        <div>
          <label htmlFor="order-wallet" className="label">
            Wallet used for this order
          </label>
          <input
            id="order-wallet"
            className="field font-mono text-sm"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x…"
          />
        </div>
      )}
      {phase && (
        <p className="font-heading font-semibold capitalize">
          {phase.replace("_", " ")}
        </p>
      )}
      {message && <p className="text-sm text-[var(--mp-text-muted)]">{message}</p>}
      {explorerUrl && (
        <a
          className="btn-primary"
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          View transaction
        </a>
      )}
      {error && (
        <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
