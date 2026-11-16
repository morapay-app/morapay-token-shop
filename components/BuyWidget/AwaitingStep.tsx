import { WaitCountdown } from "./WaitCountdown";

type Props = {
  phone: string;
  network: string;
  orderRef: string | null;
  waitStartedAt: number;
  onWaitTimeout: () => void;
};

export function AwaitingStep(props: Props) {
  return (
    <div className="space-y-4 text-center py-4">
      <WaitCountdown
        startedAt={props.waitStartedAt}
        mode="awaiting"
        onTimeout={props.onWaitTimeout}
      />
      <p className="text-sm text-[var(--mp-text-muted)]">
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
    </div>
  );
}
