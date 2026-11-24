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
          {
            id: "card",
            kind: "card",
            label: "Card",
            enabled: false,
          },
        ],
      },
      {
        code: "KE",
        currency: "KES",
        enabled: false,
        methods: [
          {
            id: "mpesa",
            kind: "mobile_money",
            label: "M-Pesa",
            enabled: false,
          },
          {
            id: "bank_transfer",
            kind: "bank_transfer",
            label: "Bank transfer",
            enabled: false,
          },
        ],
      },
      {
        code: "ZA",
        currency: "ZAR",
        enabled: false,
        methods: [
          {
            id: "bank_transfer",
            kind: "bank_transfer",
            label: "Bank transfer (EFT)",
            enabled: false,
          },
        ],
      },
      {
        code: "CI",
        currency: "XOF",
        enabled: false,
        methods: [
          {
            id: "momo_orange",
            kind: "mobile_money",
            label: "Orange Money",
            enabled: false,
          },
        ],
      },
      {
        code: "UG",
        currency: "UGX",
        enabled: false,
        methods: [
          {
            id: "momo_mtn_ug",
            kind: "mobile_money",
            label: "MTN MoMo",
            enabled: false,
          },
        ],
      },
    ],
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