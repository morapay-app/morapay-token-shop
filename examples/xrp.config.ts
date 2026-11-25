import { ghana, nigeria } from "@/config/markets";
import type { ShopConfigInput } from "@/config/schema";
import { envSiteUrl } from "@/lib/site-url";

/** Native XRP on the XRP Ledger — chainId 144, Morapay contract id `xrp`. */
const xrpConfig = {
  shopId: "xrp",
  siteUrl: envSiteUrl("https://xrp.morapay.shop"),
  token: {
    name: "XRP",
    ticker: "XRP",
    chainId: 144,
    contract: "xrp",
    decimals: 6,
    logo: "/brand/xrp/logo.svg",
    description:
      "Buy and sell native XRP on the XRP Ledger with mobile money or bank transfer.",
    explorerTokenUrl: "https://livenet.xrpl.org/",
  },
  brand: {
    accent: "#2563EB",
    heroBg: "#E0F2FE",
    accentText: "#0F172A",
    favicon: "/brand/xrp/favicon.ico",
    layoutVariant: "default",
    ogImage: "xrp",
    overridePrimary: true,
    heroImage: "/brand/xrp/hero.svg",
    headline: "Buy XRP with mobile money or bank",
    subline:
      "Pay in cedis or naira. Native XRP is sent to your XRPL wallet — use a destination tag when your exchange requires it.",
  },
  countries: {
    default: "GH",
    list: [ghana(), nigeria()],
  },
  /** Core sells need at least 4 USDC of value; 5 XRP leaves room for price moves. */
  sell: { enabled: true, minToken: 5, maxToken: 7000 },
  fees: { showFeeLine: true },
  telegram: {
    deskUrl: "https://t.me/morapay",
  },
  attribution: { utmSource: "xrp" },
  socials: {},
  altBuyLinks: [
    {
      label: "XRPL Explorer",
      url: "https://livenet.xrpl.org/",
    },
  ],
  faqExtra: [
    {
      q: "What is a destination tag?",
      a: "Exchanges and some hosted wallets use a numeric destination tag so they know which customer receives the XRP. If your wallet shows a tag, enter it at checkout when buying, and always include the tag Morapay gives you when selling.",
    },
    {
      q: "Which XRPL address should I use?",
      a: "Paste your classic r… address or mainnet X-address from your wallet. Testnet X-addresses are not supported for payouts.",
    },
  ],
  analytics: {},
} satisfies ShopConfigInput;

export default xrpConfig;
