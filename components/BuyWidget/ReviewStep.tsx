"use client";

import { useState, type ReactNode } from "react";
import type { QuoteView } from "./machine";
import { getChain } from "@/config/chains";
import { maskPhone } from "@/lib/validate/phone";

type Props = {
  quote: QuoteView;
  /** "MTN MoMo", "Bank transfer". */
  methodLabel: string;
  isMobileMoney: boolean;
  phone: string;
  wallet: string;
  payoutDestinationTag?: string;
  chainId: number;
  accepted: boolean;
  submitting: boolean;
  showFee?: boolean;
  onAccept: (v: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
};

function shortAddr(a: string) {
  if (a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function Row(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[var(--mp-text-muted)]">{props.label}</dt>
      <dd>{props.children}</dd>
    </div>
  );
}

export function ReviewStep(props: Props) {
  const [clicked, setClicked] = useState(false);
  const chain = getChain(props.chainId);
  const usdNumber = Number(props.quote.usdValue);
  const usd =
    usdNumber > 0
      ? usdNumber.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : null;

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold">Review</h2>
      <dl className="subcard p-4 space-y-2 text-sm">
        <Row label="You pay">
          <span className="font-numbers font-bold">
            {props.quote.inputAmount} {props.quote.inputCurrency}
          </span>
        </Row>
        <Row label="You receive">
          <span className="font-numbers font-bold">
            {Number(props.quote.outputAmount).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}{" "}
            {props.quote.outputCurrency}
          </span>
        </Row>
        {usd && <Row label="Value">{usd}</Row>}
        {props.showFee && props.quote.totalFee != null && (
          <Row label="Fee">{String(props.quote.totalFee)}</Row>
        )}
        <Row label={props.isMobileMoney ? "Network" : "Pay with"}>{props.methodLabel}</Row>
        {props.phone ? <Row label="Number">{maskPhone(props.phone)}</Row> : null}
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">Wallet</dt>
          <dd className="font-mono">{shortAddr(props.wallet)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--mp-text-muted)]">Chain</dt>
          <dd>{chain?.name ?? props.chainId}</dd>
        </div>
        {props.payoutDestinationTag ? (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--mp-text-muted)]">Dest. tag</dt>
            <dd className="font-mono">{props.payoutDestinationTag}</dd>
          </div>
        ) : null}
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
