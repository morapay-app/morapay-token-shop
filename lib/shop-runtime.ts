import { shopConfig } from "@/shop.config";
import {
  getRampConfig,
  isTokenSupported,
  tokenDirections,
  type RampConfig,
} from "@/lib/morapay/ramp";
import { findShopToken, shopTokens, type ShopToken } from "@/lib/shop-tokens";
import { getMerchantConfigStatus, merchantSigningEnabled } from "@/lib/morapay/merchant-config";

export type HealthSnapshot = {
  morapay: "ok" | "down" | "fallback" | "setup";
  tokenSupported: boolean;
  corridors: string[];
  fallback: boolean;
  merchantSigning: boolean;
  setupRequired?: boolean;
  reason?: string;
};

let cache: { at: number; config: RampConfig } | null = null;
const CACHE_MS = 5 * 60_000;

export async function getCachedRampConfig(): Promise<RampConfig | null> {
  if (!merchantSigningEnabled()) return null;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.config;
  try {
    const config = await getRampConfig();
    cache = { at: Date.now(), config };
    return config;
  } catch {
    return cache?.config ?? null;
  }
}

export async function getHealth(): Promise<HealthSnapshot> {
  const signing = merchantSigningEnabled();

  if (!signing) {
    const status = getMerchantConfigStatus();
    return {
      morapay: "setup",
      tokenSupported: false,
      corridors: [],
      fallback: true,
      merchantSigning: false,
      setupRequired: true,
      reason: status.ready ? undefined : status.reason,
    };
  }

  if (process.env.FORCE_FALLBACK === "true") {
    return {
      morapay: "fallback",
      tokenSupported: false,
      corridors: [],
      fallback: true,
      merchantSigning: true,
      reason: "FORCE_FALLBACK",
    };
  }

  try {
    const config = await getCachedRampConfig();
    if (!config) {
      return {
        morapay: "down",
        tokenSupported: false,
        corridors: [],
        fallback: true,
        merchantSigning: true,
        reason: "unreachable",
      };
    }
    // The token the shop opens on: the primary, or the first open token when the primary is
    // "coming soon" (the Pi shop sells PCM while PI waits). A coming-soon PI must not close the shop.
    const openToken = findShopToken(shopConfig, null) ?? shopConfig.token;
    const tokenSupported = isTokenSupported(config, openToken.chainId, openToken.contract);
    return {
      morapay: tokenSupported ? "ok" : "fallback",
      tokenSupported,
      corridors: config.supportedCurrencies.map((c) => c.toLowerCase()),
      fallback: !tokenSupported,
      merchantSigning: true,
      reason: tokenSupported ? undefined : "token_not_supported",
    };
  } catch {
    return {
      morapay: "down",
      tokenSupported: false,
      corridors: [],
      fallback: true,
      merchantSigning: true,
      reason: "error",
    };
  }
}

export function getShopConfig() {
  return shopConfig;
}

export type OfferedToken = ShopToken & { buyAvailable: boolean; sellAvailable: boolean };

/**
 * Tokens the shop shows right now. The primary token follows the shop health check (fallback
 * desk when core drops it); an extra token shows only in the directions core currently lists.
 */
export async function offeredShopTokens(): Promise<OfferedToken[]> {
  const tokens = shopTokens(shopConfig);
  const live = tokens.length > 1 ? await getCachedRampConfig() : null;
  return tokens.map((token) => {
    if (token.primary) return { ...token, buyAvailable: token.buyEnabled, sellAvailable: token.sellEnabled };
    const directions = live ? tokenDirections(live, token.chainId, token.contract) : { buy: false, sell: false };
    return {
      ...token,
      buyAvailable: token.buyEnabled && directions.buy,
      sellAvailable: token.sellEnabled && directions.sell,
    };
  });
}

/**
 * Why a request names a token. "quote" may price a coming-soon token (price only); "order" never
 * opens one. Buy orders and sells pass "order".
 */
export type TokenRequestPurpose = "quote" | "order";

/** The token a buy/sell/quote request names, from config only (never a client-sent contract). */
export async function resolveRequestToken(
  ticker: string | null | undefined,
  direction: "buy" | "sell",
  purpose: TokenRequestPurpose,
): Promise<{ ok: true; token: ShopToken } | { ok: false; status: number; code: string; message: string }> {
  const token = findShopToken(shopConfig, ticker);
  if (!token) return { ok: false, status: 400, code: "token.unknown", message: "Token not available." };
  if (token.comingSoon) {
    if (purpose === "quote") return { ok: true, token };
    return { ok: false, status: 400, code: "token.coming_soon", message: `${token.ticker} is coming soon.` };
  }
  if (token.primary) return { ok: true, token };
  const offered = (await offeredShopTokens()).find((t) => t.ticker === token.ticker);
  const available = direction === "buy" ? offered?.buyAvailable : offered?.sellAvailable;
  if (!available) {
    return { ok: false, status: 503, code: "token.paused", message: `${token.ticker} ${direction === "buy" ? "buys" : "sells"} are paused.` };
  }
  return { ok: true, token };
}
