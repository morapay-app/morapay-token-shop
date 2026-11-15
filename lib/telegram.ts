export function buildDeskDeepLink(opts: {
  deskUrl: string;
  amount: string;
  currency: string;
  ticker: string;
  chainName: string;
  contract: string;
  wallet: string;
  method: string;
  shopId: string;
  referral?: string;
}): string {
  const text = [
    `Hi, I want to buy ${opts.amount} ${opts.currency} of $${opts.ticker}`,
    `(${opts.chainName}, ${opts.contract}) to wallet ${opts.wallet}.`,
    `Paying with ${opts.method}.`,
    `Ref ${opts.shopId}/${opts.referral ?? "none"}`,
  ].join(" ");

  const base = opts.deskUrl.replace(/\/$/, "");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}text=${encodeURIComponent(text)}`;
}
