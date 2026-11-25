import type { AccountNameCheck } from "./useAccountName";

/** Verified account holder under the account number. */
export function AccountName({
  check,
  onRetry,
}: {
  check: AccountNameCheck;
  onRetry: () => void;
}) {
  return (
    <div id="sell-account-name" className="text-sm mt-2 empty:hidden" aria-live="polite">
      {check.state === "checking" && (
        <p className="text-[var(--mp-text-muted)]">Checking name…</p>
      )}
      {check.state === "ok" && (
        <p>
          Paid to: <span className="font-semibold">{check.name}</span>
        </p>
      )}
      {check.state === "failed" && (
        <p className="text-[var(--mp-warning-text)]">
          {check.message}{" "}
          <button type="button" className="underline" onClick={onRetry}>
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
