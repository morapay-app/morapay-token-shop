const MIN_CODE = /(?:^|[._-])(?:min(?:imum)?|too_?low|too_?small|below_?min)/i;

const MIN_TEXT =
  /below\s+(?:the\s+)?minimum|minimum\s+(?:buy|order|amount|fiat)|amount\s+is\s+too\s+(?:low|small)/i;

/** User-facing quote failure copy (Morapay codes/messages → clear shop wording). */
export function quoteClientMessage(
  code: string | undefined,
  message: string | undefined,
  opts?: { minFiat?: number; currency?: string },
): string {
  const isBelowMin =
    (code && MIN_CODE.test(code)) ||
    (message != null && MIN_TEXT.test(message));

  if (isBelowMin) {
    if (opts?.minFiat != null && opts.currency) {
      return `Amount is below the minimum. Enter at least ${opts.minFiat} ${opts.currency}.`;
    }
    if (message && !/something went wrong/i.test(message)) {
      return message;
    }
    return "Amount is below the minimum for this country.";
  }

  if (message && message.trim() && !/something went wrong/i.test(message)) {
    return message;
  }
  return "Could not get a quote. Try a different amount.";
}

export function isBelowMinimumQuoteError(
  code?: string,
  message?: string,
): boolean {
  return (
    (code != null && MIN_CODE.test(code)) ||
    (message != null && MIN_TEXT.test(message))
  );
}