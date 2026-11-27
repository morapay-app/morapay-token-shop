/** Shown under a coming-soon token's quote: price only, the flow stops here. */
export function ComingSoonNote({ ticker }: { ticker: string }) {
  return (
    <p className="text-sm text-[var(--mp-text-muted)]" role="status">
      <span
        className="underline decoration-dotted cursor-help"
        title={`${ticker} buys and sells open once ${ticker} delivery is live. Until then you can check the price here.`}
      >
        {ticker} is coming soon. Quotes only for now.
      </span>
    </p>
  );
}
