import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RiskDisclaimer } from "@/components/RiskDisclaimer";
import { HowItWorks } from "@/components/HowItWorks";
import { TokenInfo } from "@/components/TokenInfo";
import { Faq } from "@/components/Faq";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";
import { textOnHero } from "@/lib/contrast";

export default function HomePage() {
  const headline = shopConfig.brand.headline.replace(
    "${ticker}",
    `$${shopConfig.token.ticker}`,
  );
  const heroBg = shopConfig.brand.heroBg ?? "#FFFFFF";
  const heroText = textOnHero(heroBg);
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
    <main>
      <Header />
      <section className="w-full max-w-[480px] mx-auto px-4 pt-4 pb-6">
        <div className="hero-band p-6 mb-5" style={{ color: heroText }}>
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
            <p
              className="text-sm"
              style={{
                color: `color-mix(in srgb, ${heroText} 82%, transparent)`,
              }}
            >
              {shopConfig.brand.subline}
            </p>
          )}
        </div>
        <BuyWidget />
      </section>
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
