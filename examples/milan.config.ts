import { ghana, nigeria, plannedMarkets } from "@/config/markets";
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
    list: [ghana({ card: true }), nigeria(), ...plannedMarkets],
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
