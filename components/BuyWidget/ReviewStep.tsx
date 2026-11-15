"use client";

import { useState } from "react";
import type { QuoteView } from "./machine";
import { getChain } from "@/config/chains";
import { maskPhone } from "@/lib/validate/phone";

type Props = {
  quote: QuoteView;
  methodId: string;
  phone: string;
  wallet: string;
  chainId: number;
  accepted: boolean;
  submitting: boolean;
  onAccept: (v: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
};

function shortAddr(a: string) {
  if (a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function ReviewStep(props: Props) {
  const [clicked, setClicked] = useState(false);
  const chain = getChain(props.chainId);

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold">Review</h2>
      <dl className="subcard p-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">You pay</dt>
          <dd className="font-numbers font-bold">
            {props.quote.inputAmount} {props.quote.inputCurrency}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">You receive</dt>
          <dd className="font-numbers font-bold">
            {Number(props.quote.outputAmount).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            {props.quote.outputCurrency}
          </dd>
        </div>
        {props.quote.exchangeRate && (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--mp-text-muted)]">Rate</dt>
            <dd>{props.quote.exchangeRate}</dd>
          </div>
        )}
        {props.quote.totalFee != null && (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--mp-text-muted)]">Fee</dt>
            <dd>{String(props.quote.totalFee)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">Method</dt>
          <dd>
            {props.methodId}
            {props.phone ? ` · ${maskPhone(props.phone)}` : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">Wallet</dt>
          <dd className="font-mono">{shortAddr(props.wallet)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">Chain</dt>
          <dd>{chain?.name ?? props.chainId}</dd>
        </div>
      </dl>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={props.accepted}
          onChange={(e) => props.onAccept(e.target.checked)}
        />
        <span>
          I am 18+ and understand crypto prices are volatile and transfers are
          final.
        </span>
      </label>

      <div className="flex gap-3">
        <button type="button" className="btn-ghost flex-1" onClick={props.onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={!props.accepted || clicked}
          onClick={() => {
            setClicked(true);
            props.onConfirm();
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
