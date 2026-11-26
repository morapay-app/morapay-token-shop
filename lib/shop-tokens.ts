import type { ShopConfig } from "@/config/schema";
import { getChain } from "@/config/chains";

type FiatCaps = { minFiat: number; maxFiat: number };

/** One token a shop offers: the primary `token`, then any `extraTokens`, in config order. */
export type ShopToken = ShopConfig["token"] & {
  primary: boolean;
  /** Shown as "soon" in the picker; no buys or sells. */
  comingSoon: boolean;
  /** Picker label. */
  label: string;
  /** Tooltip under the picker. */
  hint?: string;
  chainName: string;
  buyEnabled: boolean;
  sellEnabled: boolean;
  /** Per-currency (upper-case) fiat range; narrows the country caps. */
  buyCaps: Record<string, FiatCaps>;
  sellMinToken?: number;
  sellMaxToken?: number;
};

export function shopTokens(shop: ShopConfig): ShopToken[] {
  const primary: ShopToken = {
    ...shop.token,
    primary: true,
    comingSoon: shop.token.comingSoon === true,
    label: shop.token.ticker,
    chainName: getChain(shop.token.chainId)?.name ?? "",
    buyEnabled: shop.token.comingSoon !== true,
    sellEnabled: shop.token.comingSoon !== true && shop.sell.enabled,
    buyCaps: {},
    sellMinToken: shop.sell.minToken,
    sellMaxToken: shop.sell.maxToken,
  };
  const extras = (shop.extraTokens ?? []).map(({ label, hint, buy, sell, ...token }): ShopToken => ({
    ...token,
    primary: false,
    comingSoon: token.comingSoon === true,
    label: label ?? token.ticker,
    ...(hint ? { hint } : {}),
    chainName: getChain(token.chainId)?.name ?? "",
    buyEnabled: token.comingSoon !== true && buy.enabled,
    sellEnabled: token.comingSoon !== true && shop.sell.enabled && sell.enabled,
    buyCaps: Object.fromEntries(Object.entries(buy.caps).map(([currency, caps]) => [currency.toUpperCase(), caps])),
    sellMinToken: sell.minToken,
    sellMaxToken: sell.maxToken,
  }));
  return [primary, ...extras];
}

/**
 * The shop token a request names by ticker; the primary token when none is named. Null for any
 * ticker this shop does not offer: callers refuse, never fall back to a client-sent contract.
 */
export function findShopToken(shop: ShopConfig, ticker?: string | null): ShopToken | null {
  const tokens = shopTokens(shop);
  const wanted = ticker?.trim().toUpperCase();
  // No ticker: the first token that is open (a "coming soon" primary is skipped).
  if (!wanted) return tokens.find((token) => !token.comingSoon) ?? tokens[0]!;
  return tokens.find((token) => token.ticker.toUpperCase() === wanted) ?? null;
}

/** Order belongs to which shop token (receipts: explorer links on the right chain). */
export function shopTokenForOrder(
  shop: ShopConfig,
  order: { chainId?: unknown; tokenAddress?: unknown; tokenSymbol?: unknown },
): ShopToken {
  const tokens = shopTokens(shop);
  const chainId = Number(order.chainId);
  const address = typeof order.tokenAddress === "string" ? order.tokenAddress.toLowerCase() : "";
  const symbol = typeof order.tokenSymbol === "string" ? order.tokenSymbol.toUpperCase() : "";
  return (
    tokens.find((t) => Number.isFinite(chainId) && t.chainId === chainId && address && t.contract.toLowerCase() === address) ??
    tokens.find((t) => (!Number.isFinite(chainId) || t.chainId === chainId) && symbol && t.ticker.toUpperCase() === symbol) ??
    tokens[0]!
  );
}
