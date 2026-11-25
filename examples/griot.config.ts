import { ghana, nigeria } from "@/config/markets";
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
    list: [ghana(), nigeria()],
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
