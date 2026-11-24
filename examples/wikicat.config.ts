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