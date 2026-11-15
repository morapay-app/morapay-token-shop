"use client";

import type { BuyStep } from "./machine";

type Props = {
  step: BuyStep;
  orderRef: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  error: string | null;
  retryAfterSec: number | null;
  ticker: string;
  contract: string;
  deskUrl: string;
  onRetry: () => void;
};

export function StatusStep(props: Props) {
  if (props.step === "delivering") {
    return (
      <div className="space-y-3 text-center py-6">
        <h2 className="font-heading text-xl font-bold">
          Payment received, delivering tokens…
        </h2>
        <ol className="text-left text-sm space-y-2 max-w-xs mx-auto">
          <li>✓ Payment received</li>
          <li>→ Buying tokens</li>
          <li>→ Sending to your wallet</li>
        </ol>
        {props.orderRef && (
          <p className="text-xs font-mono text-[var(--mp-text-muted)]">
            {props.orderRef}
          </p>
        )}
      </div>
    );
  }

  if (props.step === "completed") {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="receipt-card p-5 rounded-[32px]">
          <h2 className="font-heading text-xl font-bold text-[var(--receipt-text)]">
            Tokens sent
          </h2>
          {props.explorerUrl && props.txHash && (
            <a
              className="inline-block mt-3 text-[var(--receipt-accent)] underline break-all"
              href={props.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
            </a>
          )}
        </div>
        <div className="subcard p-4 text-left text-sm">
          <p className="font-medium">Add ${props.ticker} to your wallet</p>
          <p className="font-mono text-xs break-all mt-1">{props.contract}</p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (navigator.share && props.explorerUrl) {
              void navigator.share({
                title: `Bought $${props.ticker}`,
                url: props.explorerUrl,
              });
            }
          }}
        >
          Share
        </button>
      </div>
    );
  }

  if (props.step === "still_processing") {
    return (
      <div className="space-y-4 text-center py-6">
        <h2 className="font-heading text-xl font-bold">Still processing</h2>
        <p className="text-sm text-[var(--mp-text-muted)]">
          {props.error ??
            "This is taking longer than usual. Keep your reference handy."}
        </p>
        {props.orderRef && (
          <p className="font-mono text-sm">{props.orderRef}</p>
        )}
        <a className="btn-primary inline-flex" href={props.deskUrl}>
          Contact support
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center py-6">
      <h2 className="font-heading text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
        {props.error ?? "Please try again."}
      </p>
      {props.retryAfterSec ? (
        <p className="text-sm">Retry in {props.retryAfterSec}s</p>
      ) : null}
      {props.orderRef && (
        <p className="font-mono text-xs text-[var(--mp-text-muted)]">
          {props.orderRef}
        </p>
      )}
      <div className="flex gap-3 justify-center">
        <button type="button" className="btn-ghost" onClick={props.onRetry}>
          Try again
        </button>
        <a className="btn-primary" href={props.deskUrl}>
          Telegram support
        </a>
      </div>
    </div>
  );
}
