import type { ShopConfigInput } from "@/config/schema";

/**
 * GRIOT example (BSC).
 * TODO(owner): confirm contract, decimals, branding, socials, desk URL, referral.
 */
const griotConfig = {
  shopId: "griot",
  siteUrl: "https://example.com",
  token: {
    name: "GRIOT",
    ticker: "GRIOT",
    chainId: 56,
    // Placeholder — replace with verified GRIOT contract from Morapay supportedOnrampTargets
    contract: "0x0000000000000000000000000000000000000001",
    decimals: 18,
    logo: "/brand/logo.png",
    description: "GRIOT community token on BNB Chain. TODO(owner): final copy.",
  },
  brand: {
    accent: "#2B6CB0",
    accentText: "#FFFFFF",
    headline: "Buy $GRIOT with mobile money or bank",
    subline: "Pay in cedis or naira. Tokens go straight to your BNB Chain wallet.",
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
  sell: { enabled: false },
  fees: { showFeeLine: true },
  telegram: {
    deskUrl: "https://t.me/morapay",
  },
  attribution: { utmSource: "griot" },
  socials: {},
  altBuyLinks: [],
  analytics: {},
} satisfies ShopConfigInput;

export default griotConfig;
