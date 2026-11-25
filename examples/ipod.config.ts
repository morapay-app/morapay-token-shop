import { ghana, nigeria, plannedMarkets } from "@/config/markets";
import type { ShopConfigInput } from "@/config/schema";

/**
 * IPOD — Base (8453). Contract/symbol/decimals from Morapay catalog
 * GET /api/public/catalog/tokens?chain_id=8453 (verified 23 Nov 2026).
 */
const ipodConfig = {
  shopId: "ipod",
  siteUrl: "https://ipodonchain.com",
  token: {
    name: "IPOD",
    ticker: "IPOD",
    chainId: 8453,
    contract: "0xA6af0cEa8FBC93E1eCcC00f1FdD9a0BBa251FeE1",
    decimals: 18,
    logo: "/brand/ipod/logo.webp",
    description:
      "IPOD is a community internet asset on Base — Apple is the company, IPOD is the culture.",
    explorerTokenUrl:
      "https://basescan.org/token/0xA6af0cEa8FBC93E1eCcC00f1FdD9a0BBa251FeE1",
  },
  brand: {
    accent: "#0071E3",
    heroBg: "#F5F5F7",
    accentText: "#FFFFFF",
    favicon: "/brand/ipod/favicon.ico",
    layoutVariant: "simple",
    overridePrimary: true,
    headline: "Buy $IPOD with mobile money or bank",
    subline:
      "Pay in naira or cedis. $IPOD is delivered to your Base wallet — any address you control.",
  },
  countries: {
    default: "NG",
    list: [nigeria(), ghana({ card: true }), ...plannedMarkets],
  },
  sell: { enabled: false },
  fees: { showFeeLine: false },
  telegram: {
    deskUrl: "https://t.me/morapay",
  },
  attribution: { utmSource: "ipod" },
  socials: {
    x: "https://x.com/iPodAAPLc",
    website: "https://ipodonchain.com",
  },
  altBuyLinks: [
    {
      label: "ipodonchain.com",
      url: "https://ipodonchain.com",
      note: "Official site",
    },
    {
      label: "Basescan",
      url: "https://basescan.org/token/0xA6af0cEa8FBC93E1eCcC00f1FdD9a0BBa251FeE1",
    },
  ],
  faqExtra: [
    {
      q: "Which chain is IPOD on?",
      a: "Base only. Use a Base wallet address at checkout.",
    },
    {
      q: "Is this the official IPOD token?",
      a: "Match the contract address on this page with Basescan before you pay.",
    },
  ],
  analytics: {},
} satisfies ShopConfigInput;

export default ipodConfig;
