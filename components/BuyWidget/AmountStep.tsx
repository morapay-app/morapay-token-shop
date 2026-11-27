"use client";

import { useState } from "react";
import type { QuoteView } from "./machine";
import { flagFor } from "@/config/countries";

type Props = {
  currency: string;
  amount: string;
  quote: QuoteView | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
  quickAmounts: number[];
  limits?: { minFiat: number; maxFiat: number };
  showFee: boolean;
  countries: Array<{ code: string; currency: string; selectable: boolean }>;
  country: string;
  ticker: string;
  onAmount: (v: string) => void;
  onCountry: (code: string, currency: string) => void;
  onNext: () => void;
  rateLockSeconds?: number;
  /** Coming-soon token: show the price, never continue. */
  quoteOnly?: boolean;
};

export function AmountStep(props: Props) {
  // A chip is active only after a tap, and only while the amount still matches it.
  const [chip, setChip] = useState<number | null>(null);
  const activeChip = chip != null && Number(props.amount) === chip ? chip : null;
  const amountNum = Number(props.amount || 0);
  const within =
    !props.limits ||
    (amountNum >= props.limits.minFiat && amountNum <= props.limits.maxFiat);
  const canNext = amountNum > 0 && within && !!props.quote && !props.quoteOnly;

  const lockSec =
    props.quote && props.rateLockSeconds != null ? props.rateLockSeconds : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-xl font-bold">Amount</h2>
        <label className="sr-only" htmlFor="country">
          Country
        </label>
        <select
          id="country"
          className="pill bg-[var(--mp-pill-inactive)] text-[var(--mp-pill-inactive-text)] text-sm font-medium px-3 py-2"
          value={props.country}
          onChange={(e) => {
            const c = props.countries.find((x) => x.code === e.target.value);
            if (c) props.onCountry(c.code, c.currency);
          }}
        >
          {props.countries.map((c) => (
            <option key={c.code} value={c.code} disabled={!c.selectable}>
              {flagFor(c.code)} {c.currency}
              {!c.selectable ? " (soon)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="label">
          You pay ({props.currency})
        </label>
        <input
          id="amount"
          inputMode="decimal"
          className="field font-numbers text-3xl"
          value={props.amount}
          onChange={(e) => {
            setChip(null);
            props.onAmount(e.target.value.replace(/[^\d.]/g, ""));
          }}
          placeholder={props.limits ? String(props.limits.minFiat) : "0"}
          aria-describedby="amount-hint"
        />
        <p id="amount-hint" className="mt-2 text-sm text-[var(--mp-text-muted)]">
          {props.limits
            ? `Min ${props.limits.minFiat} · Max ${props.limits.maxFiat} ${props.currency}`
            : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
        {props.quickAmounts.map((q) => (
          <button
            key={q}
            type="button"
            aria-pressed={activeChip === q}
            className={`pill text-sm px-3 py-2 min-h-11 ${
              activeChip === q
                ? "bg-[var(--mp-pill-active)] text-[var(--mp-text)] font-semibold"
                : "bg-[var(--mp-pill-inactive)] text-[var(--mp-pill-inactive-text)]"
            }`}
            onClick={() => {
              setChip(q);
              props.onAmount(String(q));
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="subcard p-4" aria-live="polite" aria-busy={props.quoteLoading}>
        {props.quoteLoading ? (
          <div className="space-y-3" role="status">
            <span className="sr-only">Fetching quote</span>
            <div className="skeleton h-8 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-4 w-2/5 rounded-md" />
            <p className="text-sm text-[var(--mp-text-muted)]">Getting quote…</p>
          </div>
        ) : props.quote ? (
          <>
            <p className="font-numbers text-2xl font-extrabold">
              ≈{" "}
              {Number(props.quote.outputAmount).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              ${props.ticker}
            </p>
            {Number(props.quote.usdValue) > 0 && (
              <p className="text-sm text-[var(--mp-text-muted)] mt-1">
                {Number(props.quote.usdValue).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </p>
            )}
            {props.showFee && props.quote.totalFee != null && (
              <p className="text-sm text-[var(--mp-text-muted)] mt-1">
                Fee {String(props.quote.totalFee)}
              </p>
            )}
            <p className="text-sm text-[var(--mp-text-muted)] mt-1">
              Rate locks for {lockSec}s
            </p>
          </>
        ) : props.quoteError ? (
          <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
            {props.quoteError}
          </p>
        ) : (
          <p className="text-sm text-[var(--mp-text-muted)]">
            Enter an amount to see your quote.
          </p>
        )}
      </div>

      {!within && amountNum > 0 && (
        <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
          Amount is outside the allowed range.
        </p>
      )}

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!canNext}
        onClick={() => {
          if (canNext) props.onNext();
        }}
      >
        {props.quoteOnly ? "Coming soon" : "Continue"}
      </button>
    </div>
  );
}
