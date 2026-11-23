import type { ShopConfigInput } from "@/config/schema";

/** Native XRP on the XRP Ledger — chainId 144, Morapay contract id `xrp`. */
const xrpConfig = {
  shopId: "xrp",
  siteUrl: "https://example.com",
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
    layoutVariant: "default",
    overridePrimary: true,
    heroImage: "/brand/xrp/hero.svg",
    headline: "Buy XRP with mobile money or bank",
    subline:
      "Pay in naira or cedis. Native XRP is sent to your XRPL wallet — use a destination tag when your exchange requires it.",
  },
  countries: {
    default: "NG",
    list: [
      {
        code: "NG",
        currency: "NGN",
        enabled: true,
        quickAmounts: [5000, 10000, 25000, 50000],
        caps: { minFiat: 3000, maxFiat: 5000000 },
        methods: [
          {
            id: "bank_transfer",
            kind: "bank_transfer",
            label: "Bank transfer",
            enabled: true,
          },
        ],
      },
      {
        code: "GH",
        currency: "GHS",
        enabled: true,
        quickAmounts: [50, 100, 200, 500],
        caps: { minFiat: 50, maxFiat: 2900 },
        methods: [
          {
            id: "momo_mtn",
            kind: "mobile_money",
            label: "MTN MoMo",
            enabled: true,
            networkProvider: "MTN",
            institutionCode: "0004",
            phonePrefixes: ["024", "025", "053", "054", "055", "059"],
          },
          {
            id: "momo_telecel",
            kind: "mobile_money",
            label: "Telecel Cash",
            enabled: true,
            networkProvider: "Vodafone",
            institutionCode: "0006",
            phonePrefixes: ["020", "050"],
          },
          {
            id: "momo_airteltigo",
            kind: "mobile_money",
            label: "AirtelTigo Money",
            enabled: true,
            networkProvider: "AirtelTigo",
            institutionCode: "0005",
            phonePrefixes: ["026", "027", "056", "057"],
          },
          {
            id: "bank_transfer",
            kind: "bank_transfer",
            label: "Bank transfer",
            enabled: true,
          },
        ],
      },
    ],
  },
  sell: { enabled: true, minToken: 1, maxToken: 50000 },
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