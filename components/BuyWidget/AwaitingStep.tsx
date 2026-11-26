import { OrderProgress, TrackOrderLink, buySteps } from "@/components/OrderProgress";
import { shopConfig } from "@/shop.config";
import { WaitCountdown } from "./WaitCountdown";

type Props = {
  /** Token being bought (multi-token shops); defaults to the shop token. */
  ticker?: string;
  phone: string;
  network: string;
  orderRef: string | null;
  waitStartedAt: number;
  onWaitTimeout: () => void;
};

const MTN_TIPS = [
  "No prompt? Dial *170# → My Wallet → My Approvals.",
  "Keep your phone unlocked and on signal.",
  "Have the amount plus MoMo charges in your wallet.",
  "Never share your PIN or approve prompts you didn't start.",
];

const GENERIC_TIPS = [
  "Keep your phone unlocked and on signal.",
  "Have the amount plus MoMo charges in your wallet.",
];

export function AwaitingStep(props: Props) {
  const isMtn = props.network.trim().toUpperCase().startsWith("MTN");
  const tips = isMtn ? MTN_TIPS : GENERIC_TIPS;
  return (
    <div className="space-y-4 text-center py-4">
      <WaitCountdown
        startedAt={props.waitStartedAt}
        mode="awaiting"
        onTimeout={props.onWaitTimeout}
      />
      <p className="text-sm text-[var(--mp-text-muted)]">
        Approve the prompt on {props.phone || "your phone"} with your MoMo PIN.
      </p>
      <div className="subcard p-4 text-left">
        <p className="text-sm font-semibold">{isMtn ? "MTN tips" : "Tips"}</p>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--mp-text-muted)] list-disc pl-5">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <OrderProgress steps={buySteps("awaiting", (props.ticker ?? shopConfig.token.ticker))} />
      <TrackOrderLink orderRef={props.orderRef} />
    </div>
  );
}
