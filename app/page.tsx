import type { CSSProperties } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RiskDisclaimer } from "@/components/RiskDisclaimer";
import { HowItWorks } from "@/components/HowItWorks";
import { TokenInfo } from "@/components/TokenInfo";
import { Faq } from "@/components/Faq";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import {
  CultureMarquee,
  CultureRail,
  CultureStageBrand,
} from "@/components/CultureRails";
import { PiHome } from "@/components/themes/PiHome";
import { SimpleTokenHome } from "@/components/themes/SimpleTokenHome";
import { WikiCatHome } from "@/components/themes/WikiCatHome";
import { resolveHomeLayoutVariant } from "@/lib/home-layout";
import { shopConfig } from "@/shop.config";

export default function HomePage() {
  const headline = shopConfig.brand.headline.replace(
    "${ticker}",
    `$${shopConfig.token.ticker}`,
  );
  const layoutVariant = resolveHomeLayoutVariant(shopConfig);
  const culture =
    layoutVariant === "culture" && shopConfig.culture?.enabled !== false
      ? shopConfig.culture
      : undefined;
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I need an exchange account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. You only need a wallet address that can receive the token.",
        },
      },
      {
        "@type": "Question",
        name: "Is Morapay holding my tokens?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Tokens are sent to your own wallet.",
        },
      },
    ],
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopConfig.token.name,
    url: shopConfig.siteUrl,
    description: shopConfig.token.description,
  };

  return (
    <main
      className={
        layoutVariant === "wikicat"
          ? "shop-wikicat"
          : layoutVariant === "simple"
            ? "shop-brand-hero"
            : layoutVariant === "pi"
            ? "shop-pi"
            : culture
            ? "shop-with-culture"
            : undefined
      }
    >
      {layoutVariant === "wikicat" ? (
        <WikiCatHome headline={headline} subline={shopConfig.brand.subline} />
      ) : layoutVariant === "pi" ? (
        <PiHome headline={headline} subline={shopConfig.brand.subline} />
      ) : layoutVariant === "simple" ? (
        <SimpleTokenHome headline={headline} subline={shopConfig.brand.subline} />
      ) : culture ? (
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
          <Header onCulture />
          <CultureMarquee items={culture.marquee} />
          <div className="culture-stage-grid">
            <CultureRail blocks={culture.left} side="left" />
            <div className="culture-stage-center">
              <CultureStageBrand
                culture={culture}
                ticker={shopConfig.token.ticker}
              />
              {culture.visual ? (
                <div className="culture-visual" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={culture.visual}
                    alt=""
                    width={900}
                    height={600}
                  />
                </div>
              ) : null}
              <p className="culture-buy-kicker">{headline}</p>
              {shopConfig.brand.subline ? (
                <p className="culture-buy-sub">{shopConfig.brand.subline}</p>
              ) : null}
              <BuyWidget />
            </div>
            <CultureRail blocks={culture.right} side="right" />
          </div>
        </section>
      ) : (
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
              {shopConfig.brand.subline && (
                <p className="text-sm opacity-90">{shopConfig.brand.subline}</p>
              )}
            </div>
            <BuyWidget />
          </section>
        </>
      )}
      <HowItWorks />
      <TokenInfo />
      <Faq />
      <RiskDisclaimer />
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </main>
  );
}
