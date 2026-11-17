import Link from "next/link";
import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";

const FEATURES = [
  {
    title: "Fair launch",
    body: "Born March 2022 on BNB Chain for SMC DAO — a meme token built to teach believers crypto basics.",
    tone: "violet",
  },
  {
    title: "Community owned",
    body: "Ownership renounced. No single wallet runs Wiki Cat — believers steer the story together.",
    tone: "mint",
  },
  {
    title: "Believers first",
    body: "From Sir Mapy’s classroom to a mega community — educate, hold, and grow with $WKC.",
    tone: "sky",
  },
] as const;

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
        <span className="wikicat-eyebrow">$WKC on BNB Chain</span>
        <WikiCatMascot />
        <h1 className="wikicat-headline">
          <span className="wikicat-headline-wiki">Wiki</span>{" "}
          <span className="wikicat-headline-cat">Cat</span>
        </h1>
        <p className="wikicat-tagline">{headline}</p>
        {subline ? <p className="wikicat-subline">{subline}</p> : null}
        <div className="wikicat-buy-shell">
          <BuyWidget />
        </div>
      </div>
      <div className="wikicat-features">
        <div className="wikicat-features-grid">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className={`wikicat-feature wikicat-feature--${f.tone}`}
            >
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
        <div className="wikicat-cta-row">
          <Link
            className="wikicat-cta"
            href="https://wiki-cat.gitbook.io/wiki-cat-docs"
            target="_blank"
            rel="noreferrer"
          >
            Read the whitepaper
          </Link>
          <Link
            className="wikicat-cta wikicat-cta--ghost"
            href="https://wikicatcoin.com"
            target="_blank"
            rel="noreferrer"
          >
            wikicatcoin.com
          </Link>
          <Link
            className="wikicat-cta wikicat-cta--ghost"
            href="https://x.com/WikiCatCoin"
            target="_blank"
            rel="noreferrer"
          >
            @WikiCatCoin
          </Link>
        </div>
      </div>
    </section>
  );
}

function WikiCatMascot() {
  return (
    <div className="wikicat-mascot-wrap" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shopConfig.token.logo}
        alt=""
        width={200}
        height={172}
        className="wikicat-mascot"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/wikicat/coins.png"
        alt=""
        width={120}
        height={80}
        className="wikicat-coins"
      />
    </div>
  );
}
