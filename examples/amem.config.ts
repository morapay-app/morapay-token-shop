import type { ShopConfigInput } from "@/config/schema";

/** AMEM example — The African Meme on BNB Chain. */
const amemConfig = {
  shopId: "theafricanmeme",
  siteUrl: "https://token-shop-production-ecd0135d.up.railway.app",
  token: {
    name: "The African Meme",
    ticker: "AMEM",
    chainId: 56,
    contract: "0x0B9237Fc2D9b2bA19023ddBCCF0Dd649092bb649",
    decimals: 9,
    logo: "/brand/amem/logomark.png",
    description:
      "$AMEM is a community-backed BNB Chain meme token that funds buybacks and liquidity for African crypto projects.",
    explorerTokenUrl:
      "https://bscscan.com/token/0x0B9237Fc2D9b2bA19023ddBCCF0Dd649092bb649",
  },
  brand: {
    accent: "#FFC830",
    heroBg: "#0A0A0A",
    accentText: "#0A0A0A",
    overridePrimary: true,
    heroImage: "/brand/amem/coin-web.webp",
    headline: "Buy $AMEM with mobile money or bank",
    subline:
      "Pay in cedis or naira. $AMEM lands in your BNB Chain wallet — one buyback at a time.",
  },
  culture: {
    enabled: true,
    homeUrl: "https://theafricanmeme.com",
    stageBg: "#0A0A0A",
    stageText: "#F5F1E6",
    accent: "#FFC830",
    brandLine: "The African Meme",
    roar: "THE LION OF THE BLOCKCHAIN HAS ROARED",
    marquee: [
      "$AMEM",
      "THE AFRICAN MEME",
      "ONE BUYBACK AT A TIME",
      "THE PRIDE IS RISING",
      "BUILT ON BNB CHAIN",
    ],
    visual: "/brand/amem/coin-web.webp",
    left: [
      {
        type: "blurb",
        title: "Not just a meme. A movement.",
        body: "African projects often stall on thin liquidity — not weak vision. $AMEM feeds a treasury so the community can back African builders with real on-chain buybacks.",
      },
      {
        type: "quote",
        text: "A rising tide lifts all boats — shared prosperity across communities and builders.",
        by: "The Pride",
      },
      {
        type: "cta",
        label: "Read the full story",
        href: "https://theafricanmeme.com",
      },
    ],
    right: [
      {
        type: "pulse",
        label: "Treasury hunt",
        detail: "Every trade seeds the war chest. The pride votes; buybacks land in African project LPs.",
        href: "https://theafricanmeme.com",
      },
      {
        type: "post",
        source: "Community",
        title: "The Den is open",
        body: "Live shilling sessions, holder DAO voice, and the lion’s weekly rhythm — join The African Meme on Telegram.",
        href: "https://t.me/theafricanmeme",
      },
      {
        type: "post",
        source: "Chart",
        title: "Watch the lion run",
        body: "Live AMEM/WBNB on PancakeSwap via DexScreener — same pool the pride trades.",
        href: "https://dexscreener.com/bsc/0x488280785783b21eb969fa4cd322042aed662b38",
      },
      {
        type: "cta",
        label: "Follow @theafricanmeme",
        href: "https://x.com/theafricanmeme",
      },
    ],
  },
  countries: {
    default: "GH",
    list: [
      {
        code: "GH",
        currency: "GHS",
        enabled: true,
        quickAmounts: [50, 100, 200, 500],
        caps: { minFiat: 50, maxFiat: 1000 },
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
        code: "NG",
        currency: "NGN",
        enabled: true,
        quickAmounts: [5000, 10000, 25000, 50000],
        caps: { minFiat: 3000, maxFiat: 200000 },
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
    // TODO(owner): replace with real Morapay desk link
    deskUrl: "https://t.me/morapay",
    communityUrl: "https://t.me/theafricanmeme",
  },
  attribution: { utmSource: "theafricanmeme" },
  socials: {
    x: "https://x.com/theafricanmeme",
    telegram: "https://t.me/theafricanmeme",
    dexscreener:
      "https://dexscreener.com/bsc/0x488280785783b21eb969fa4cd322042aed662b38",
  },
  altBuyLinks: [
    {
      label: "PancakeSwap",
      url: "https://pancakeswap.finance/swap?outputCurrency=0x0B9237Fc2D9b2bA19023ddBCCF0Dd649092bb649",
      note: "Trade $AMEM on BNB Chain",
    },
    {
      label: "DexScreener",
      url: "https://dexscreener.com/bsc/0x488280785783b21eb969fa4cd322042aed662b38",
    },
    {
      label: "BscScan",
      url: "https://bscscan.com/token/0x0B9237Fc2D9b2bA19023ddBCCF0Dd649092bb649",
    },
  ],
  analytics: {},
} satisfies ShopConfigInput;

export default amemConfig;
