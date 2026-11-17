export function SetupRequired({ reason }: { reason?: string }) {
  return (
    <div className="mp-setup-notice rounded-2xl border border-amber-700/25 bg-amber-50 p-6 text-sm leading-relaxed text-amber-950">
      <p className="text-base font-semibold text-amber-950">
        Merchant API keys required
      </p>
      <p className="mt-2 text-amber-900/90">
        This shop cannot place orders until{" "}
        <code className="rounded bg-amber-900/10 px-1 font-mono text-[0.85em]">
          MORAPAY_MERCHANT_PUBLIC_KEY
        </code>{" "}
        and{" "}
        <code className="rounded bg-amber-900/10 px-1 font-mono text-[0.85em]">
          MORAPAY_MERCHANT_SECRET_KEY
        </code>{" "}
        are set on the server. Unsigned public Morapay calls are disabled by default.
      </p>
      {reason ? (
        <p className="mt-2 text-amber-900/80">
          Status: <span className="font-mono">{reason}</span>
        </p>
      ) : null}
      <p className="mt-3 text-amber-900/75">
        See the README for getting test/live keys from the Morapay dashboard and deploying on
        Railway or Vercel.
      </p>
    </div>
  );
}