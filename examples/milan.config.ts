import type { ShopConfigInput } from "@/config/schema";

/** MILAN example — milanthepug.com (section 13). */
const milanConfig = {
  shopId: "milanthepug",
  siteUrl: "https://milanthepug.com",
  token: {
    name: "Milan the Pug",
    ticker: "MILAN",
    chainId: 56,
    contract: "0x5C9Ff301Ec2d882B635813739cC07330788d7322",
    decimals: 18,
    logo: "/brand/logo.png",
    description:
      "Milan is the first pug tokenized on the Genius.fun launchpad on BNB Chain. A community token.",
    explorerTokenUrl:
      "https://bscscan.com/token/0x5C9Ff301Ec2d882B635813739cC07330788d7322",
  },
  brand: {
    accent: "#D91C7F",
    heroBg: "#1A0B2E",
    accentText: "#FFFFFF",
    heroImage: "/brand/hero.jpg",
    headline: "Buy $MILAN with mobile money or bank",
    subline:
      "Pay in cedis or naira. $MILAN is sent straight to your BNB Chain wallet.",
  },
  countries: {
    default: "GH",
    list: [
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
    communityUrl: "https://t.me/+_yYrWfdbjaUwZmE0",
  },
  // TODO(owner): set referralCode MP-XXXXXX for Milan
  attribution: { utmSource: "milanthepug" },
  socials: {
    x: "https://x.com/milanthepug",
    tiktok: "https://www.tiktok.com/@milanthepug0",
    telegram: "https://t.me/+_yYrWfdbjaUwZmE0",
    geniusfun:
      "https://genius.fun/token/0x5C9Ff301Ec2d882B635813739cC07330788d7322",
  },
  altBuyLinks: [
    {
      label: "Genius.fun",
      url: "https://genius.fun/token/0x5C9Ff301Ec2d882B635813739cC07330788d7322",
      note: "Official launchpad",
    },
    {
      label: "Trust Wallet → PancakeSwap",
      url: "https://link.trustwallet.com/open_url?coin_id=20000714&url=https://pancakeswap.finance/swap?outputCurrency=0x5C9Ff301Ec2d882B635813739cC07330788d7322",
    },
    {
      label: "Binance Wallet",
      url: "https://www.binance.com/en/web3wallet",
    },
  ],
  analytics: { plausibleDomain: "milanthepug.com" },
} satisfies ShopConfigInput;

export default milanConfig;
