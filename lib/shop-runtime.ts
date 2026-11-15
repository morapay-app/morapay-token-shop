import { shopConfig } from "@/shop.config";
import {
  getRampConfig,
  isTokenSupported,
  type RampConfig,
} from "@/lib/morapay/ramp";

export type HealthSnapshot = {
  morapay: "ok" | "down" | "fallback";
  tokenSupported: boolean;
  corridors: string[];
  fallback: boolean;
  reason?: string;
};

let cache: { at: number; config: RampConfig } | null = null;
const CACHE_MS = 5 * 60_000;

export async function getCachedRampConfig(): Promise<RampConfig | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.config;
  try {
    const config = await getRampConfig();
    cache = { at: Date.now(), config };
    return config;
  } catch {
    return cache?.config ?? null;
  }
}

export function __clearRampCache() {
  cache = null;
}

export async function getHealth(): Promise<HealthSnapshot> {
  if (process.env.FORCE_FALLBACK === "true") {
    return {
      morapay: "fallback",
      tokenSupported: false,
      corridors: [],
      fallback: true,
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
        reason: "unreachable",
      };
    }
    const tokenSupported = isTokenSupported(
      config,
      shopConfig.token.chainId,
      shopConfig.token.contract,
    );
    return {
      morapay: tokenSupported ? "ok" : "fallback",
      tokenSupported,
      corridors: config.supportedCurrencies.map((c) => c.toLowerCase()),
      fallback: !tokenSupported,
      reason: tokenSupported ? undefined : "token_not_supported",
    };
  } catch {
    return {
      morapay: "down",
      tokenSupported: false,
      corridors: [],
      fallback: true,
      reason: "error",
    };
  }
}

export function getShopConfig() {
  return shopConfig;
}
