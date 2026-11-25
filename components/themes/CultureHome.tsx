import type { CSSProperties } from "react";
import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";
import { CultureMarquee, CultureRail, CultureStageBrand } from "./CultureRails";
import { DefaultHome } from "./DefaultHome";
import type { HomeProps } from "./types";

/** Token-culture stage: story rails on both sides of the buy card. */
export function CultureHome({ headline, subline }: HomeProps) {
  const { culture } = shopConfig;
  if (!culture) return <DefaultHome headline={headline} subline={subline} />;
  return (
    <section
      className="culture-stage"
      style={
        {
          "--culture-bg": culture.stageBg ?? "#0A0A0A",
          "--culture-text": culture.stageText ?? "#F5F1E6",
          "--culture-accent": culture.accent ?? shopConfig.brand.accent,
        } as CSSProperties
      }
    >
      <Header variant="culture" />
      <CultureMarquee items={culture.marquee} />
      <div className="culture-stage-grid">
        <CultureRail blocks={culture.left} side="left" />
        <div className="culture-stage-center">
          <CultureStageBrand culture={culture} ticker={shopConfig.token.ticker} />
          {culture.visual ? (
            <div className="culture-visual" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={culture.visual} alt="" width={900} height={600} />
            </div>
          ) : null}
          <p className="culture-buy-kicker">{headline}</p>
          {subline ? <p className="culture-buy-sub">{subline}</p> : null}
          <BuyWidget />
        </div>
        <CultureRail blocks={culture.right} side="right" />
      </div>
    </section>
  );
}
