"use client";

type Props = {
  deposit: Record<string, unknown> | null;
  orderRef: string | null;
};

function flatten(obj: Record<string, unknown>, prefix = ""): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v as Record<string, unknown>, key));
    } else {
      out.push([key, String(v)]);
    }
  }
  return out;
}

export function BankDepositStep(props: Props) {
  const rows = props.deposit ? flatten(props.deposit) : [];

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">Bank deposit</h2>
      <p className="text-sm text-[var(--mp-text-muted)]">
        Transfer the exact amount to the account below. Use the reference so we
        can match your payment.
      </p>
      <ul className="space-y-2">
        {rows.map(([k, v]) => (
          <li
            key={k}
            className="subcard p-3 flex items-start justify-between gap-3"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--mp-text-muted)]">
                {k}
              </p>
              <p className="font-mono text-sm break-all">{v}</p>
            </div>
            <button
              type="button"
              className="btn-ghost text-xs shrink-0"
              onClick={() => void copy(v)}
            >
              Copy
            </button>
          </li>
        ))}
      </ul>
      {props.orderRef && (
        <p className="text-xs text-[var(--mp-text-muted)] font-mono">
          Order {props.orderRef}
        </p>
      )}
    </div>
  );
}
