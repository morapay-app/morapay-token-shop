/** Shown under a coming-soon token's quote: price only, the flow stops here. */
export function ComingSoonNote({ ticker }: { ticker: string }) {
  return (
    <p className="text-sm text-[var(--mp-text-muted)]" role="status">
      <span
        className="underline decoration-dotted cursor-help"
        title={`${ticker} buys and sells open once ${ticker} delivery is live. The price shown is live.`}
      >
        Live {ticker} price. Orders open later.
      </span>
    </p>
  );
}
