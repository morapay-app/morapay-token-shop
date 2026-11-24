import { shopConfig } from "@/shop.config";

const isPi = shopConfig.shopId === "pi";

const DEFAULT_FAQ = [
  {
    q: "What is this?",
    a: isPi
      ? "A Morapay shop where you can buy and sell Pi with mobile money or bank transfer. Not affiliated with Pi Network."
      : `A community page where you can buy $${shopConfig.token.ticker} with mobile money or bank transfer, powered by Morapay.`,
  },
  {
    q: "Do I need an exchange account?",
    a: "No. You only need a wallet address that can receive the token on the supported chain.",
  },
  {
    q: "Which wallet do I need?",
    a: isPi
      ? "A Pi Network wallet. Its address starts with G."
      : "Any wallet that supports the token’s chain (for BNB Chain: Trust Wallet, Binance Wallet, MetaMask, and others).",
  },
  {
    q: "How long does it take?",
    a: "Usually a few minutes after you pay. Timing depends on the payment network and blockchain.",
  },
  {
    q: "What are the fees?",
    a: "Fees are shown in the quote before you confirm.",
  },
  {
    q: "What if my payment fails?",
    a: "You will see a clear status and reference. Contact the Telegram desk with that reference for help.",
  },
  {
    q: "Is Morapay holding my tokens?",
    a: "No. Tokens are sent to your own wallet.",
  },
  {
    q: "Who runs this site?",
    a: isPi
      ? "Morapay."
      : `The $${shopConfig.token.ticker} community, using Morapay’s payment service.`,
  },
  {
    q: "How do I get support?",
    a: "Use the Telegram desk link in the footer.",
  },
];

export function Faq() {
  const items = [...DEFAULT_FAQ, ...shopConfig.faqExtra];
  return (
    <section className="w-full max-w-[480px] mx-auto px-4 py-8" id="faq">
      <h2 className="font-heading text-2xl font-bold mb-4">FAQ</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.q} className="card p-4 group">
            <summary className="font-heading font-semibold cursor-pointer list-none flex justify-between gap-2">
              {item.q}
              <span className="text-[var(--mp-text-muted)] group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm text-[var(--mp-text-muted)] leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
