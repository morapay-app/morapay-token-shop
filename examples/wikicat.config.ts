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
      "Wiki Cat is a community-owned cat meme on BNB Chain, born in SMC for believers who hold, learn, and grow together.",
    explorerTokenUrl:
      "https://bscscan.com/token/0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
  },
  brand: {
    accent: "#FF6B2C",
    heroBg: "#120C28",
    accentText: "#FFFFFF",
    overridePrimary: true,
    heroImage: "/brand/wikicat/hero.png",
    headline: "Buy $WKC with mobile money or bank",
    subline:
      "Pay in naira or cedis. $WKC is delivered to your BNB Chain wallet — including PeniWallet.",
  },
  culture: {
    enabled: true,
    homeUrl: "https://wikicatcoin.com",
    stageBg: "#120C28",
    stageText: "#F8F4FF",
    accent: "#FF6B2C",
    brandLine: "Wiki Cat",
    roar: "BELIEVERS BUY LOCAL — CAT MEMES GO GLOBAL",
    marquee: [
      "$WKC",
      "WIKI CAT",
      "SMC BELIEVERS",
      "COMMUNITY-OWNED",
      "BNB CHAIN",
      "SIR MAPY",
    ],
    visual: "/brand/wikicat/logo.png",
    left: [
      {
        type: "blurb",
        title: "Not just a meme — a mega community.",
        body: "Wiki Cat started with Sir Mapy and the SMC family as a fun, educational meme. Today believers across Africa and beyond stack $WKC and show up for each other.",
      },
      {
        type: "quote",
        text: "Ownership is renounced. The loudest voice in the room is the community.",
        by: "SMC Believers",
      },
      {
        type: "cta",
        label: "Read the whitepaper",
        href: "https://wiki-cat.gitbook.io/wiki-cat-docs",
      },
    ],
    right: [
      {
        type: "pulse",
        label: "SMC Mega Group",
        detail:
          "Join tens of thousands of believers learning, trading stories, and vibing with the cat — the heart of Wiki Cat culture.",
        href: "https://wikicatcoin.com",
      },
      {
        type: "post",
        source: "Community",
        title: "PeniWallet ready",
        body: "Paste any BNB Chain address you control. PeniWallet and other BSC wallets work great for receiving $WKC.",
      },
      {
        type: "post",
        source: "Verify",
        title: "Official contract only",
        body: "Always confirm the BNB Chain contract on BscScan before you buy. Wiki Cat lives on BNB Chain — community-first, believer-led.",
        href: "https://bscscan.com/token/0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
      },
      {
        type: "cta",
        label: "Follow @WikiCatCoin",
        href: "https://x.com/WikiCatCoin",
      },
    ],
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