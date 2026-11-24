"use client";

import type { BuyStep } from "./machine";
import type { OrderReceipt } from "@/lib/morapay/receipt";
import { Receipt } from "@/components/Receipt";
import { WaitCountdown } from "./WaitCountdown";

type Props = {
  step: BuyStep;
  orderRef: string | null;
  receipt: OrderReceipt | null;
  wallet: string;
  error: string | null;
  retryAfterSec: number | null;
  deskUrl: string;
  waitStartedAt?: number | null;
  onWaitTimeout?: () => void;
  onRetry: () => void;
};

export function StatusStep(props: Props) {
  if (props.step === "delivering") {
    return (
      <div className="space-y-4 text-center py-6">
        {props.waitStartedAt != null ? (
          <WaitCountdown
            startedAt={props.waitStartedAt}
            mode="delivering"
            onTimeout={props.onWaitTimeout}
          />
        ) : (
          <h2 className="font-heading text-xl font-bold">
            Payment received, delivering tokens…
          </h2>
        )}
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
    return props.receipt ? (
      <Receipt receipt={props.receipt} wallet={props.wallet} />
    ) : (
      <div className="space-y-2 text-center py-6">
        <h2 className="font-heading text-xl font-bold">Delivered</h2>
        <p className="text-xs font-mono text-[var(--mp-text-muted)]">{props.orderRef}</p>
      </div>
    );
  }

  if (props.step === "still_processing") {
    return (
      <div className="space-y-4 text-center py-6">
        <h2 className="font-heading text-xl font-bold">Still processing</h2>
        <p className="text-sm text-[var(--mp-text-muted)]">
          {props.error ??
            "This is taking longer than 11 minutes. Keep your reference handy — support can help finish delivery."}
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
