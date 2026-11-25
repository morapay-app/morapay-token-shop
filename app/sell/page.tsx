import { redirect } from "next/navigation";
import { shopConfig } from "@/shop.config";
import { RiskDisclaimer } from "@/components/RiskDisclaimer";
import { SellWidget } from "@/components/SellWidget/SellWidget";
import { ShopMain } from "@/components/ShopMain";

export default function SellPage() {
  if (!shopConfig.sell.enabled) {
    redirect("/");
  }

  return (
    <ShopMain page="sell">
      <section className="morapay-widget-surface w-full max-w-[480px] mx-auto px-4 py-6">
        <h1 className="font-heading text-3xl font-bold mb-4">
          Sell ${shopConfig.token.ticker}
        </h1>
        <SellWidget />
      </section>
      <RiskDisclaimer />
    </ShopMain>
  );
}
