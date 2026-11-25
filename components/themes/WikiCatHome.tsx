import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";
import type { HomeProps } from "./types";

export function WikiCatHome({ headline, subline }: HomeProps) {
  return (
    <section className="wikicat-hero" aria-label="Wiki Cat">
      <Header variant="wikicat" />
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
