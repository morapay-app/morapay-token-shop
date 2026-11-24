import Link from "next/link";

export type ProgressStep = { label: string; state: "done" | "active" | "todo" };

const MARK = { done: "✓", active: "", todo: "" } as const;
const SR = { done: "done", active: "in progress", todo: "not started" } as const;

export function OrderProgress({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="subcard p-4 space-y-3 text-left text-sm" aria-label="Order progress">
      {steps.map((step) => (
        <li
          key={step.label}
          className="flex items-center gap-3"
          aria-current={step.state === "active" ? "step" : undefined}
        >
          <span
            aria-hidden="true"
            className={`grid place-items-center h-6 w-6 shrink-0 rounded-full text-xs font-bold ${
              step.state === "done"
                ? "bg-[var(--mp-pill-active)] text-[var(--mp-text)]"
                : step.state === "active"
                  ? "border-[3px] border-[var(--mp-divider)] border-t-[var(--mp-button-bg)] animate-spin motion-reduce:animate-none"
                  : "border-2 border-[var(--mp-divider)]"
            }`}
          >
            {MARK[step.state]}
          </span>
          <span className={step.state === "todo" ? "text-[var(--mp-text-muted)]" : "font-medium"}>
            {step.label}
            <span className="sr-only"> ({SR[step.state]})</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function TrackOrderLink({ orderRef }: { orderRef: string | null }) {
  if (!orderRef) return null;
  return (
    <p className="text-xs text-center text-[var(--mp-text-muted)]">
      <span className="font-mono break-all">{orderRef}</span>
      <br />
      <Link className="underline" href={`/order/${encodeURIComponent(orderRef)}`} target="_blank">
        Track this order
      </Link>
    </p>
  );
}

export function buySteps(stage: "awaiting" | "delivering", ticker: string): ProgressStep[] {
  const paid = stage === "delivering";
  return [
    { label: paid ? "Payment received" : "Approve the payment", state: paid ? "done" : "active" },
    { label: `Getting your ${ticker}`, state: paid ? "active" : "todo" },
    { label: "Delivered to your wallet", state: "todo" },
  ];
}
