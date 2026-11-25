import { faqItems } from "@/lib/shop-copy";
import { shopConfig } from "@/shop.config";

export function Faq() {
  const items = faqItems(shopConfig);
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
