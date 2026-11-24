import type { ShopConfigInput } from "@/config/schema";

const resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://pi.morapay.shop";

/**
 * Native PI on Pi Network mainnet — internal chainId 31415926, Morapay contract id `pi`.
 * Buy and sell limits come from core quotes/limits; no shop-level PI cap.
 */
const piConfig = {
  shopId: "pi",
  /** Runtime canonical URL also comes from `NEXT_PUBLIC_SITE_URL` in layout/sitemap. */
  siteUrl: resolvedSiteUrl,
  token: {
    name: "Pi",
    ticker: "PI",
    chainId: 31415926,
    contract: "pi",
    decimals: 7,
    logo: "/brand/pi/logo.svg",
    description:
      "Buy and sell native Pi on Pi Network mainnet with mobile money or bank transfer.",
    explorerTokenUrl: "https://blockexplorer.minepi.com/mainnet",
  },
  brand: {
    accent: "#6B3FA0",
    heroBg: "#2A1052",
    accentText: "#FFFFFF",
    favicon: "/brand/pi/favicon.ico",
    layoutVariant: "pi",
    overridePrimary: true,
    heroImage: "/brand/pi/hero.svg",
    headline: "Buy Pi with mobile money or bank",
    subline:
      "Pay in cedis or naira. Native PI is sent to your Pi Network wallet.",
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
    ],
  },
  /** Core enforces sell value limits on the quote; no shop-level PI floor or cap. */
  sell: { enabled: true },
  fees: { showFeeLine: true },
  telegram: {
    deskUrl: "https://t.me/morapay",
  },
  attribution: { utmSource: "pi" },
  socials: {},
  altBuyLinks: [],
  faqExtra: [
    {
      q: "Which address should I use?",
      a: "Your Pi Network wallet address. It starts with G and is 56 characters long. Find it in the Pi Wallet app under Receive. Do not use a BNB Chain or other network address.",
    },
    {
      q: "What is the memo when selling?",
      a: "Each sell order gets its own memo. Send the exact amount with that memo so we can match your payment. A missing or wrong memo means the payment is held for review.",
    },
  ],
  analytics: {},
} satisfies ShopConfigInput;

export default piConfig;
