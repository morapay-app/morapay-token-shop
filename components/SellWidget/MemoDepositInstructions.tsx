"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  ticker: string;
  networkName: string;
  depositAddress: string;
  depositMemo: string;
  depositAmount: string;
  orderRef: string;
};

function CopyButton(props: { value: string; label: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={props.primary ? "btn-primary w-full" : "btn-ghost w-full"}
      onClick={() => {
        void navigator.clipboard
          ?.writeText(props.value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => undefined);
      }}
    >
      {copied ? "Copied" : props.label}
    </button>
  );
}

/**
 * Sell deposit for memo-matched chains (Pi): our address, the exact amount and the memo.
 * The memo is what ties the payment to this order, so it is the most prominent field.
 */
export function MemoDepositInstructions(props: Props) {
  const { ticker, networkName, depositAddress, depositMemo, depositAmount, orderRef } = props;

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-heading text-xl font-bold">Send {ticker}</h2>
      <p className="text-sm text-[var(--mp-text-muted)]">
        Send from your {networkName} wallet now.{" "}
        <span
          className="underline decoration-dotted cursor-help"
          title={`Use the ${networkName} wallet app. Do not send ${ticker} on BNB Chain or any other network. Orders with no deposit are cancelled.`}
        >
          Which wallet?
        </span>
      </p>

      <div
        className="rounded-2xl border-2 border-[var(--mp-warning-text)] bg-[var(--mp-warning-bg)] p-4 space-y-2"
        role="alert"
        aria-labelledby="deposit-memo-label"
      >
        <p id="deposit-memo-label" className="font-semibold text-[var(--mp-warning-text)]">
          Memo (required)
        </p>
        <p
          className="font-mono text-2xl font-bold text-center tracking-wider break-all"
          data-testid="deposit-memo"
        >
          {depositMemo}
        </p>
        <CopyButton value={depositMemo} label="Copy memo" primary />
        <p className="text-sm">
          A missing or wrong memo means your payment is held for review.
        </p>
      </div>

      <div className="space-y-2">
        <p className="label mb-0">Exact amount</p>
        <p
          className="font-numbers text-xl font-bold subcard p-3 text-center"
          data-testid="deposit-amount"
        >
          {depositAmount} {ticker}
        </p>
        <CopyButton value={depositAmount} label="Copy amount" />
      </div>

      <div className="space-y-2">
        <p className="label mb-0">To address</p>
        <div className="flex justify-center">
          <QRCodeSVG value={depositAddress} size={144} />
        </div>
        <p className="font-mono text-xs break-all subcard p-3" data-testid="deposit-address">
          {depositAddress}
        </p>
        <CopyButton value={depositAddress} label="Copy address" />
      </div>

      <p className="text-xs font-mono text-[var(--mp-text-muted)]">Ref {orderRef}</p>
    </div>
  );
}
