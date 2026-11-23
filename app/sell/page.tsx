import { redirect } from "next/navigation";
import { resolveHomeLayoutVariant } from "@/lib/home-layout";
import { shopConfig } from "@/shop.config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RiskDisclaimer } from "@/components/RiskDisclaimer";
import { SellWidget } from "@/components/SellWidget/SellWidget";

export default function SellPage() {
  if (!shopConfig.sell.enabled) {
    redirect("/");
  }

  const variant = resolveHomeLayoutVariant(shopConfig);

  return (
    <main
      className={
        variant === "wikicat"
          ? "shop-wikicat"
          : variant === "simple"
            ? "shop-brand-hero"
            : undefined
      }
    >
      <Header brandHero={variant === "simple"} />
      <section className="morapay-widget-surface w-full max-w-[480px] mx-auto px-4 py-6">
        <h1 className="font-heading text-3xl font-bold mb-4">
          Sell ${shopConfig.token.ticker}
        </h1>
        <SellWidget />
      </section>
      <RiskDisclaimer />
      <Footer />
    </main>
  );
}
