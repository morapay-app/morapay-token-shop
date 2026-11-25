import { Footer } from "@/components/Footer";
import { RiskDisclaimer } from "@/components/RiskDisclaimer";
import { HowItWorks } from "@/components/HowItWorks";
import { TokenInfo } from "@/components/TokenInfo";
import { Faq } from "@/components/Faq";
import { HOMES } from "@/components/themes";
import { resolveHomeLayoutVariant, THEMES } from "@/config/themes";
import { shopConfig } from "@/shop.config";

export default function HomePage() {
  const headline = shopConfig.brand.headline.replace(
    "${ticker}",
    `$${shopConfig.token.ticker}`,
  );
  const variant = resolveHomeLayoutVariant(shopConfig);
  const Home = HOMES[variant];
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
    <main className={THEMES[variant].pages.home.mainClass}>
      <Home headline={headline} subline={shopConfig.brand.subline} />
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
