"use client";

import type { QuoteView } from "./machine";
import { flagFor } from "@/config/countries";

type Props = {
  currency: string;
  amount: string;
  quote: QuoteView | null;
  quickAmounts: number[];
  limits?: { minFiat: number; maxFiat: number };
  showFee: boolean;
  countries: Array<{ code: string; currency: string; selectable: boolean }>;
  country: string;
  ticker: string;
  onAmount: (v: string) => void;
  onCountry: (code: string, currency: string) => void;
  onNext: () => void;
};

export function AmountStep(props: Props) {
  const amountNum = Number(props.amount || 0);
  const within =
    !props.limits ||
    (amountNum >= props.limits.minFiat && amountNum <= props.limits.maxFiat);
  const canNext = amountNum > 0 && within && !!props.quote;

  const lockSec = props.quote
    ? Math.max(0, Math.floor((Date.parse(props.quote.expiresAt) - Date.now()) / 1000))
    : 0;

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
              {flagFor(c.code)} {c.code} · {c.currency}
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
          onChange={(e) =>
            props.onAmount(e.target.value.replace(/[^\d.]/g, ""))
          }
          placeholder={props.limits ? String(props.limits.minFiat) : "0"}
          aria-describedby="amount-hint"
        />
        <p id="amount-hint" className="mt-2 text-sm text-[var(--mp-text-muted)]">
          {props.limits
            ? `Min ${props.limits.minFiat} · Max ${props.limits.maxFiat} ${props.currency}`
            : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {props.quickAmounts.map((q) => (
          <button
            key={q}
            type="button"
            className="pill bg-[var(--mp-pill-inactive)] text-[var(--mp-pill-inactive-text)] text-sm px-3 py-2 min-h-11"
            onClick={() => props.onAmount(String(q))}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="subcard p-4" aria-live="polite">
        {props.quote ? (
          <>
            <p className="font-numbers text-2xl font-extrabold">
              ≈{" "}
              {Number(props.quote.outputAmount).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              ${props.ticker}
            </p>
            {props.showFee && props.quote.totalFee != null && (
              <p className="text-sm text-[var(--mp-text-muted)] mt-1">
                Fee {String(props.quote.totalFee)}
              </p>
            )}
            <p className="text-sm text-[var(--mp-text-muted)] mt-1">
              Rate locks for {lockSec}s
            </p>
          </>
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
        onClick={props.onNext}
      >
        Continue
      </button>
    </div>
  );
}
