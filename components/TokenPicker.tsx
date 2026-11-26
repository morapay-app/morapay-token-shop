"use client";

export type PickerToken = {
  ticker: string;
  label: string;
  logo: string;
  chainName: string;
  hint?: string;
  /** Shown as "soon" and not selectable. */
  comingSoon?: boolean;
};

type Props = {
  id: string;
  tokens: PickerToken[];
  value: string;
  onChange: (ticker: string) => void;
  disabled?: boolean;
};

/** Compact token switch for shops that offer more than one token. Renders nothing for one. */
export function TokenPicker({ id, tokens, value, onChange, disabled }: Props) {
  if (tokens.length < 2) return null;
  const active = tokens.find((t) => t.ticker === value && !t.comingSoon) ?? tokens.find((t) => !t.comingSoon) ?? tokens[0]!;
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Token" id={id}>
        {tokens.map((t) => {
          const on = t.ticker === active.ticker;
          const soon = t.comingSoon === true;
          return (
            <button
              key={t.ticker}
              type="button"
              role="radio"
              aria-checked={on}
              aria-disabled={soon || undefined}
              disabled={disabled || soon}
              title={soon ? `${t.ticker} is coming soon` : t.hint ?? `${t.ticker} on ${t.chainName}`}
              className={`pill inline-flex items-center gap-2 text-sm px-3 py-2 min-h-11 ${
                on
                  ? "bg-[var(--mp-pill-active)] text-[var(--mp-text)] font-semibold"
                  : "bg-[var(--mp-pill-inactive)] text-[var(--mp-pill-inactive-text)]"
              }${soon ? " opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => onChange(t.ticker)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.logo} alt="" width={20} height={20} className="rounded-full" />
              {t.label}
              {soon ? <span className="text-xs font-normal">· soon</span> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[var(--mp-text-muted)]">
        <span className="underline decoration-dotted cursor-help" title={active.hint ?? `${active.ticker} on ${active.chainName}`}>
          On {active.chainName}
        </span>
      </p>
    </div>
  );
}
