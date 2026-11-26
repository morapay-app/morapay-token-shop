"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canOfferOrderCancel,
  ORDER_CANCEL_OFFER_AFTER_MS,
  orderCancelCopy,
  readOrderCancel,
  type StoredCancel,
} from "@/lib/order-cancel-copy";

const CHECK_MS = 20_000;

/**
 * "Cancel onramp" / "Cancel offramp" under an in-progress order. Shows only on the device that opened
 * the order (it holds the cancel token), after ORDER_CANCEL_OFFER_AFTER_MS, while the shop server
 * says the order is still unpaid. Always asks first; "Keep order" is the focused default.
 */
export function CancelOrder({ orderRef, onCancelled }: { orderRef: string | null; onCancelled: () => void }) {
  const [stored, setStored] = useState<StoredCancel | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [cancellable, setCancellable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setStored(orderRef ? readOrderCancel(orderRef) : null);
  }, [orderRef]);

  const due = stored != null && now - stored.openedAt >= ORDER_CANCEL_OFFER_AFTER_MS;

  // Clock until the offer is due, then a light status check for "still unpaid".
  useEffect(() => {
    if (!stored) return;
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [stored]);

  useEffect(() => {
    if (!due || !orderRef) return;
    let stop = false;
    const check = async () => {
      try {
        const j = await (await fetch(`/api/orders/${encodeURIComponent(orderRef)}`)).json();
        if (!stop && j?.success) setCancellable(j.data?.cancellable === true);
      } catch {
        /* keep the last answer */
      }
    };
    void check();
    const id = setInterval(() => void check(), CHECK_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [due, orderRef]);

  const close = useCallback(() => {
    if (busy) return;
    dialogRef.current?.close();
    setError(null);
  }, [busy]);

  if (!orderRef || !stored) return null;
  if (!canOfferOrderCancel({ openedAt: stored.openedAt, now, cancellable })) return null;
  const copy = orderCancelCopy(stored.direction);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: stored.token }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.success) {
        dialogRef.current?.close();
        onCancelled();
        return;
      }
      setError(typeof j?.message === "string" && j.message ? j.message : "Couldn't cancel. Try again shortly.");
    } catch {
      setError("Couldn't cancel. Try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="text-center">
        <button
          type="button"
          className="btn-ghost text-sm underline"
          title={copy.tooltip}
          onClick={() => {
            setError(null);
            dialogRef.current?.showModal();
          }}
        >
          {copy.button}
        </button>
      </p>
      <dialog
        ref={dialogRef}
        aria-labelledby="cancel-order-title"
        className="card p-5 max-w-sm w-[calc(100%-32px)] backdrop:bg-black/50"
        onCancel={(event) => {
          // Escape behaves like "Keep order".
          event.preventDefault();
          close();
        }}
      >
        <h2 id="cancel-order-title" className="font-heading text-lg font-bold">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-[var(--mp-text-muted)]">{copy.body}</p>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" className="btn-primary" autoFocus disabled={busy} onClick={close}>
            {copy.keep}
          </button>
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void confirm()}>
            {busy ? "Cancelling…" : copy.confirm}
          </button>
        </div>
      </dialog>
    </>
  );
}
