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
    logo: "/brand/logo.png",
    description:
      "$AMEM is a community-backed BNB Chain meme token that funds buybacks and liquidity for African crypto projects.",
    explorerTokenUrl:
      "https://bscscan.com/token/0x0B9237Fc2D9b2bA19023ddBCCF0Dd649092bb649",
  },
  brand: {
    accent: "#F4C430",
    heroBg: "#0B3D2E",
    accentText: "#0B3D2E",
    overridePrimary: true,
    heroImage: "/brand/hero.jpg",
    headline: "Buy $AMEM with mobile money or bank",
    subline:
      "Pay in cedis or naira. $AMEM is sent straight to your BNB Chain wallet.",
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
  fees: { showFeeLine: true },
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
