import { ghana, nigeria, plannedMarkets } from "@/config/markets";
import type { ShopConfigInput } from "@/config/schema";

/** Wiki Cat (WKC) — SMC Mega Group / Sir Mapy community meme on BNB Chain. */
const wikicatConfig = {
  shopId: "wikicat",
  siteUrl: "https://wikicatcoin.com",
  token: {
    name: "Wiki Cat",
    ticker: "WKC",
    chainId: 56,
    contract: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
    decimals: 18,
    logo: "/brand/wikicat/logo.png",
    description:
      "Wiki Cat is Sir Mapy’s educational meme for SMC DAO believers — community-owned, fair-launched on BNB Chain since 2022.",
    explorerTokenUrl:
      "https://bscscan.com/token/0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
  },
  brand: {
    accent: "#6159B5",
    heroBg: "#9DE7F1",
    accentText: "#0A0A0A",
    favicon: "/brand/wikicat/favicon.ico",
    layoutVariant: "wikicat",
    overridePrimary: true,
    heroImage: "/brand/wikicat/clouds.png",
    headline: "Buy $WKC with mobile money or bank",
    subline:
      "Pay in naira or cedis. $WKC is delivered to your BNB Chain wallet — including PeniWallet.",
  },
  countries: {
    default: "NG",
    list: [nigeria(), ghana({ card: true }), ...plannedMarkets],
  },
  sell: { enabled: true },
  fees: { showFeeLine: false },
  telegram: {
    deskUrl: "https://t.me/morapay",
    communityUrl: "https://t.me/wikicatcoin",
  },
  attribution: { utmSource: "wikicat" },
  socials: {
    x: "https://x.com/WikiCatCoin",
    telegram: "https://t.me/wikicatcoin",
    website: "https://wikicatcoin.com",
  },
  altBuyLinks: [
    {
      label: "WikiCatCoin.com",
      url: "https://wikicatcoin.com",
      note: "Official site",
    },
    {
      label: "Whitepaper",
      url: "https://wiki-cat.gitbook.io/wiki-cat-docs",
    },
    {
      label: "BscScan",
      url: "https://bscscan.com/token/0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
    },
  ],
  faqExtra: [
    {
      q: "Can I use PeniWallet?",
      a: "Yes. Copy your BNB Chain receive address from PeniWallet or any BSC wallet and paste it at checkout.",
    },
    {
      q: "Is this the real Wiki Cat?",
      a: "This shop delivers the official BNB Chain token. Always match the contract address shown on this page before you pay.",
    },
  ],
  analytics: {},
} satisfies ShopConfigInput;

export default wikicatConfig;
