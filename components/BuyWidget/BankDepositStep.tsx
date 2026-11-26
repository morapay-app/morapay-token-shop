"use client";

import { useEffect, useState } from "react";
import type { BankDeposit } from "@/lib/morapay/bank-deposit";
import { OrderProgress, TrackOrderLink } from "@/components/OrderProgress";
import { shopConfig } from "@/shop.config";

type Props = {
  /** Token being bought (multi-token shops); defaults to the shop token. */
  ticker?: string;
  deposit: BankDeposit | null;
  orderRef: string | null;
};

function money(amount: string, currency: string): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
    : `${amount} ${currency}`;
}

function useTimeLeft(expiresAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = expiresAt ? Date.parse(expiresAt) : NaN;
  if (!Number.isFinite(end)) return null;
  const s = Math.max(0, Math.floor((end - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-t border-[var(--mp-divider)] first:border-t-0">
      <div className="min-w-0">
        <p className="text-xs text-[var(--mp-text-muted)]">{label}</p>
        <p className="font-numbers text-lg break-all">{value}</p>
      </div>
      {copyValue ? (
        <button
          type="button"
          className="btn-ghost text-xs shrink-0"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(copyValue)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
              .catch(() => undefined)
          }
        >
          {copied ? "Copied" : "Copy"}
        </button>
      ) : null}
    </div>
  );
}

export function BankDepositStep({ deposit, orderRef, ticker }: Props) {
  const timeLeft = useTimeLeft(deposit?.expiresAt ?? null);

  if (!deposit) {
    return (
      <div className="space-y-3" role="alert">
        <h2 className="font-heading text-xl font-bold">Bank details unavailable</h2>
        <p className="text-sm text-[var(--mp-warning-text)]">
          Don’t send money. Contact support with your order reference.
        </p>
        <TrackOrderLink orderRef={orderRef} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold">Pay by bank transfer</h2>
        <p className="text-sm text-[var(--mp-text-muted)] mt-1">
          Send exactly{" "}
          <strong className="text-[var(--mp-text)]">{money(deposit.amount, deposit.currency)}</strong> to this
          account{timeLeft ? <> within <strong className="text-[var(--mp-text)] tabular-nums">{timeLeft}</strong></> : null}.{" "}
          <span
            className="underline decoration-dotted cursor-help"
            title="This account number is for this order only. A different amount, or a transfer after it expires, can't be matched automatically."
          >
            Why exactly?
          </span>
        </p>
      </div>
      <div className="subcard px-4">
        <CopyRow label="Amount" value={money(deposit.amount, deposit.currency)} copyValue={deposit.amount} />
        <CopyRow label="Account number" value={deposit.accountNumber} copyValue={deposit.accountNumber} />
        <CopyRow label="Bank" value={deposit.bankName} />
        {deposit.accountName ? <CopyRow label="Account name" value={deposit.accountName} /> : null}
      </div>
      <OrderProgress
        steps={[
          { label: "Waiting for your transfer", state: "active" },
          { label: `Getting your ${(ticker ?? shopConfig.token.ticker)}`, state: "todo" },
          { label: "Delivered to your wallet", state: "todo" },
        ]}
      />
      <TrackOrderLink orderRef={orderRef} />
    </div>
  );
}
