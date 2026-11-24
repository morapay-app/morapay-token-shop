import { shopConfig } from "@/shop.config";

export function RiskDisclaimer() {
  const isPi = shopConfig.shopId === "pi";
  const text = isPi
    ? "Crypto assets are highly volatile and you can lose all the money you spend. This shop is run by Morapay and is not affiliated with Pi Network. Nothing here is financial advice. Check your wallet address before you buy, and only spend what you can afford to lose. Transfers can't be reversed."
    : `Crypto assets are highly volatile and you can lose all the money you spend. Meme tokens are especially risky and have no guaranteed value. This site is run by the ${shopConfig.token.ticker} community. Payments and delivery are processed by Morapay. Nothing here is financial advice. Check the contract address before you buy, and only spend what you can afford to lose. Blockchain transfers can't be reversed.`;

  return (
    <section
      className="w-full max-w-[480px] mx-auto px-4 py-6"
      aria-label="Risk disclaimer"
    >
      <div className="rounded-[24px] border border-[var(--mp-divider)] bg-[var(--mp-warning-bg)] text-[var(--mp-warning-text)] p-4 text-sm leading-relaxed">
        {text}
      </div>
    </section>
  );
}
