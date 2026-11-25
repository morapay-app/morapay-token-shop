import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";
import type { HomeProps } from "./types";

/** Classic hero: accent band with ticker and headline, buy card below. */
export function DefaultHome({ headline, subline }: HomeProps) {
  return (
    <>
      <Header />
      <section className="w-full max-w-[480px] mx-auto px-4 pt-4 pb-6">
        <div className="hero-band p-6 mb-5 text-[var(--brand-accent-text)]">
          <p
            className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 text-[var(--brand-accent-text)]"
            style={{ background: "var(--brand-accent)" }}
          >
            ${shopConfig.token.ticker}
          </p>
          <h1 className="font-heading text-3xl font-bold leading-tight mb-2">
            {headline}
          </h1>
          {subline && <p className="text-sm opacity-90">{subline}</p>}
        </div>
        <BuyWidget />
      </section>
    </>
  );
}
