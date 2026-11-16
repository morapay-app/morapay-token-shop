"use client";

import { parsePhoneForCountry } from "@/lib/validate/phone";

type Method = {
  id: string;
  kind: "mobile_money" | "bank_transfer" | "card";
  label: string;
  selectable: boolean;
  comingSoon: boolean;
  networkProvider?: string;
  phonePrefixes?: string[];
};

type Props = {
  methods: Method[];
  methodId: string;
  phone: string;
  customerName: string;
  showNameField: boolean;
  error: string | null;
  country: string;
  onMethod: (
    id: string,
    kind: Method["kind"],
    networkProvider?: string,
  ) => void;
  onPhone: (phone: string, networkHint?: string) => void;
  onName: (n: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function PaymentStep(props: Props) {
  const selected = props.methods.find((m) => m.id === props.methodId);
  const isMomo = selected?.kind === "mobile_money";
  const phoneOk = !isMomo || parsePhoneForCountry(props.phone, props.country).ok;
  const canNext = !!selected?.selectable && phoneOk;

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold">Payment</h2>

      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Payment method">
        {props.methods.map((m) => (
          <button
            key={m.id}
            type="button"
            role="option"
            aria-selected={props.methodId === m.id}
            disabled={!m.selectable}
            className={`pill px-4 py-2 min-h-11 text-sm font-medium ${
              props.methodId === m.id
                ? "bg-[var(--mp-pill-active)] text-[var(--mp-text)]"
                : "bg-[var(--mp-pill-inactive)] text-[var(--mp-pill-inactive-text)]"
            } ${!m.selectable ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() =>
              props.onMethod(m.id, m.kind, m.networkProvider)
            }
          >
            {m.label}
            {m.comingSoon ? " · soon" : ""}
          </button>
        ))}
      </div>

      {isMomo && (
        <div className="space-y-3">
          <div>
            <label htmlFor="phone" className="label">
              Mobile money number
            </label>
            <input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              className="field"
              value={props.phone}
              onChange={(e) => {
                const parsed = parsePhoneForCountry(e.target.value, props.country);
                props.onPhone(
                  e.target.value,
                  parsed.ok ? parsed.networkHint : undefined,
                );
              }}
              placeholder="0241234567"
            />
          </div>
          {props.showNameField && (
            <div>
              <label htmlFor="momo-name" className="label">
                Name on MoMo account
              </label>
              <input
                id="momo-name"
                className="field"
                value={props.customerName}
                onChange={(e) => props.onName(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {selected?.kind === "bank_transfer" && (
        <p className="text-sm text-[var(--mp-text-muted)]">
          After you confirm, we will show bank deposit details. Transfer the
          exact amount with the reference provided.
        </p>
      )}

      {selected?.kind === "card" && (
        <p className="text-sm text-[var(--mp-text-muted)]">
          Card checkout is coming soon.
        </p>
      )}

      {props.error && (
        <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
          {props.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" className="btn-ghost flex-1" onClick={props.onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={!canNext}
          onClick={props.onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
