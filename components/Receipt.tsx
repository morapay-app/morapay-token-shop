"use client";

import { useState } from "react";
import type { OrderReceipt } from "@/lib/morapay/receipt";
import { downloadBlob, receiptPng, type ReceiptRow } from "@/lib/receipt-image";
import { shopConfig } from "@/shop.config";

const short = (v: string) => (v.length > 20 ? `${v.slice(0, 8)}…${v.slice(-8)}` : v);

function amount(v: string, max: number): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: max }) : v;
}

function when(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function receiptView(receipt: OrderReceipt, wallet?: string | null) {
  const got = receipt.received
    ? `${receipt.received.estimated ? "≈ " : ""}${amount(receipt.received.amount, 6)} ${receipt.received.currency}`
    : null;
  const paid = receipt.paid ? `${amount(receipt.paid.amount, 2)} ${receipt.paid.currency}` : null;
  const rows: Array<ReceiptRow & { copy?: string; href?: string }> = [];
  if (paid) rows.push({ label: "You paid", value: paid });
  if (receipt.method) rows.push({ label: "Paid with", value: receipt.method });
  if (wallet) rows.push({ label: "Wallet", value: short(wallet), copy: wallet });
  if (receipt.chainName) rows.push({ label: "Network", value: receipt.chainName });
  if (receipt.deliveryTx) {
    rows.push({
      label: "Transaction",
      value: short(receipt.deliveryTx.hash),
      copy: receipt.deliveryTx.hash,
      href: receipt.deliveryTx.url,
    });
  }
  if (receipt.swapTx) {
    rows.push({
      label: "Swap (Base)",
      value: short(receipt.swapTx.hash),
      copy: receipt.swapTx.hash,
      href: receipt.swapTx.url,
    });
  }
  rows.push({ label: "Reference", value: short(receipt.ref), copy: receipt.ref });
  const date = when(receipt.createdAt);
  if (date) rows.push({ label: "Date", value: date });
  return { headline: got ?? paid ?? "Order complete", rows };
}

export function Receipt({ receipt, wallet }: { receipt: OrderReceipt; wallet?: string | null }) {
  const [note, setNote] = useState<string | null>(null);
  const { headline, rows } = receiptView(receipt, wallet);
  const title = receipt.direction === "buy" ? "Delivered" : "Paid out";
  const file = `morapay-receipt-${receipt.ref.slice(-8)}.png`;

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNote("Copied");
    } catch {
      setNote("Couldn't copy");
    }
  };

  const png = () =>
    receiptPng({
      shop: shopConfig.token.name,
      title,
      headline,
      rows: rows.map(({ label, value }) => ({ label, value })),
    });

  const save = async () => {
    const blob = await png();
    if (!blob) return setNote("Couldn't create the image");
    downloadBlob(blob, file);
    setNote("Receipt saved");
  };

  const share = async () => {
    const blob = await png();
    if (!blob) return setNote("Couldn't create the image");
    const data = { files: [new File([blob], file, { type: "image/png" })], title: headline };
    if (typeof navigator.canShare === "function" && navigator.canShare(data)) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    downloadBlob(blob, file);
    setNote("Sharing isn't supported here, so the receipt was saved");
  };

  return (
    <div className="space-y-4">
      <div className="receipt-card p-5 rounded-[32px] text-[var(--receipt-text)]">
        <p className="text-sm font-medium text-[var(--receipt-accent)]">✓ {title}</p>
        <p className="font-numbers text-3xl mt-1 break-words">{headline}</p>
        <dl className="mt-5 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 py-2.5 border-t border-[var(--receipt-surface)]"
            >
              <dt className="text-[var(--receipt-muted)] shrink-0">{row.label}</dt>
              <dd className="flex items-center gap-2 min-w-0 text-right">
                {row.href ? (
                  <a
                    className="underline text-[var(--receipt-accent)] truncate"
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="truncate">{row.value}</span>
                )}
                {row.copy ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--receipt-muted)] underline"
                    aria-label={`Copy ${row.label.toLowerCase()}`}
                    onClick={() => void copy(row.copy!)}
                  >
                    Copy
                  </button>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-primary flex-1" onClick={() => void share()}>
          Share receipt
        </button>
        <button type="button" className="btn-ghost flex-1" onClick={() => void save()}>
          Save image
        </button>
      </div>
      <p className="text-sm text-center text-[var(--mp-text-muted)]" role="status">
        {note}
      </p>
    </div>
  );
}
