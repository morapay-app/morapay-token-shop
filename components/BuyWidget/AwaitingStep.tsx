type Props = {
  phone: string;
  network: string;
  orderRef: string | null;
};

export function AwaitingStep(props: Props) {
  return (
    <div className="space-y-4 text-center py-4">
      <h2 className="font-heading text-xl font-bold">Approve the payment</h2>
      <p className="text-[var(--mp-text-muted)]">
        Approve the prompt on {props.phone || "your phone"}. Enter your MoMo PIN
        to complete payment.
      </p>
      {props.network === "MTN" && (
        <p className="text-sm text-[var(--mp-text-muted)]">
          MTN tip: pending approvals are under *170# → My Approvals.
        </p>
      )}
      {props.orderRef && (
        <p className="text-xs text-[var(--mp-text-muted)] font-mono">
          Ref {props.orderRef}
        </p>
      )}
      <div className="h-2 rounded-full bg-[var(--mp-subcard)] overflow-hidden">
        <div className="h-full w-1/3 bg-[var(--mp-button-bg)] animate-pulse rounded-full" />
      </div>
    </div>
  );
}
