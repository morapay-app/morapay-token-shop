export function SetupRequired({ reason }: { reason?: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm leading-relaxed">
      <p className="text-base font-semibold text-amber-100">
        Merchant API keys required
      </p>
      <p className="mt-2 text-amber-50/90">
        This shop cannot place orders until{" "}
        <code className="rounded bg-black/30 px-1">MORAPAY_MERCHANT_PUBLIC_KEY</code>{" "}
        and{" "}
        <code className="rounded bg-black/30 px-1">MORAPAY_MERCHANT_SECRET_KEY</code>{" "}
        are set on the server. Unsigned public Morapay calls are disabled by default.
      </p>
      {reason ? (
        <p className="mt-2 text-amber-100/70">
          Status: <span className="font-mono">{reason}</span>
        </p>
      ) : null}
      <p className="mt-3 text-amber-50/80">
        See the README for getting test/live keys from the Morapay dashboard and deploying on
        Railway or Vercel.
      </p>
    </div>
  );
}