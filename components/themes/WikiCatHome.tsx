import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";

export function WikiCatHome({
  headline,
  subline,
}: {
  headline: string;
  subline?: string;
}) {
  return (
    <section className="wikicat-hero" aria-label="Wiki Cat">
      <Header wikiCat />
      <div className="wikicat-hero-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shopConfig.token.logo}
          alt=""
          width={200}
          height={172}
          className="wikicat-mascot"
        />
        <h1 className="wikicat-headline">
          <span className="wikicat-headline-wiki">Wiki</span>{" "}
          <span className="wikicat-headline-cat">Cat</span>
        </h1>
        <p className="wikicat-tagline">{headline}</p>
        {subline ? <p className="wikicat-subline">{subline}</p> : null}
        <div className="wikicat-buy-shell morapay-widget-surface">
          <BuyWidget />
        </div>
      </div>
    </section>
  );
}