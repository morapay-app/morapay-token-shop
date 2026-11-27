import { ghana, nigeria } from "@/config/markets";
import type { ShopConfigInput } from "@/config/schema";
import { envSiteUrl } from "@/lib/site-url";

/**
 * Native PI on Pi Network mainnet — internal chainId 31415926, Morapay contract id `pi`.
 * Buy and sell limits come from core quotes/limits; no shop-level PI cap.
 */
const piConfig = {
  shopId: "pi",
  siteUrl: envSiteUrl("https://pi.morapay.shop"),
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
    /** PI buys and sells wait for the Pi wallets; PCM keeps the shop open meanwhile. */
    comingSoon: true,
  },
  /**
   * PCM (ERC-20 on Optimism). One thin Uniswap pool (~$11.6k, 2026-11): orders stay near $100,
   * under core's listed caps. Shown only while core lists PCM for that direction.
   */
  extraTokens: [
    {
      name: "PCM",
      ticker: "PCM",
      chainId: 10,
      contract: "0xD0CF4dE352aC8dccE00bD6B93EE73D3Cb272edC3",
      decimals: 18,
      logo: "/brand/pi/pcm.png",
      description: "PCM, an ERC-20 token on Optimism.",
      explorerTokenUrl:
        "https://optimistic.etherscan.io/token/0xd0cf4de352ac8dcce00bd6b93ee73d3cb272edc3",
      label: "PCM · OP",
      hint: "ERC-20 on Optimism. Use a 0x wallet on Optimism, not a Pi wallet. Orders are capped near $100.",
      buy: {
        enabled: true,
        caps: {
          GHS: { minFiat: 50, maxFiat: 1500 },
          NGN: { minFiat: 10000, maxFiat: 150000 },
        },
      },
      sell: { enabled: true, minToken: 500, maxToken: 5000 },
    },
  ],
  brand: {
    accent: "#6B3FA0",
    heroBg: "#2A1052",
    accentText: "#FFFFFF",
    favicon: "/brand/pi/favicon.ico",
    layoutVariant: "pi",
    ogImage: "pi",
    overridePrimary: true,
    heroImage: "/brand/pi/hero.svg",
    headline: "Buy PCM with mobile money or bank",
    subline: "Pay in cedis or naira. PCM is sent to your Optimism wallet.",
  },
  copy: {
    about:
      "A Morapay shop where you can buy PCM with mobile money or bank transfer. Not affiliated with Pi Network.",
    operator: "Morapay.",
    risk: "Crypto assets are highly volatile and you can lose all the money you spend. This shop is run by Morapay and is not affiliated with Pi Network. Nothing here is financial advice. Check your wallet address before you buy, and only spend what you can afford to lose. Transfers can't be reversed.",
  },
  countries: {
    default: "GH",
    list: [ghana(), nigeria()],
  },
  /**
   * On: the sell wallets' Privy policy allows PCM approvals on Optimism (applied 2026-11-26).
   * PI sells stay closed while PI is coming soon. Core enforces sell value limits on the quote.
   */
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
