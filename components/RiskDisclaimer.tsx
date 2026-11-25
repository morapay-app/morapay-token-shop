import { riskText } from "@/lib/shop-copy";
import { shopConfig } from "@/shop.config";

export function RiskDisclaimer() {
  return (
    <section
      className="w-full max-w-[480px] mx-auto px-4 py-6"
      aria-label="Risk disclaimer"
    >
      <div className="rounded-[24px] border border-[var(--mp-divider)] bg-[var(--mp-warning-bg)] text-[var(--mp-warning-text)] p-4 text-sm leading-relaxed">
        {riskText(shopConfig)}
      </div>
    </section>
  );
}
