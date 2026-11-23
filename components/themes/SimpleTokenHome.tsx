import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";

/** Minimal hero: logo, token title, headline/subline, buy widget (WikiCat-style). */
export function SimpleTokenHome({
  headline,
  subline,
}: {
  headline: string;
  subline?: string;
}) {
  return (
    <section className="brand-hero" aria-label={shopConfig.token.name}>
      <Header brandHero />
      <div className="brand-hero-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shopConfig.token.logo}
          alt=""
          width={160}
          height={160}
          className="brand-hero-logo"
        />
        <h1 className="brand-hero-title font-heading">{shopConfig.token.name}</h1>
        <p className="brand-hero-tagline">{headline}</p>
        {subline ? <p className="brand-hero-subline">{subline}</p> : null}
        <div className="brand-hero-buy morapay-widget-surface">
          <BuyWidget />
        </div>
      </div>
    </section>
  );
}