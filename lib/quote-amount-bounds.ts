import { belowMinimumAmountMessage } from "@/lib/quote-client-message";
import type { ShopConfig } from "@/config/schema";
import type { ShopToken } from "@/lib/shop-tokens";

type Caps = { minFiat: number; maxFiat: number };

/** Country caps narrowed by a token's own range (thin-liquidity tokens cap lower). */
export function narrowCaps(country: Caps | undefined, token: Caps | undefined): Caps | undefined {
  if (!country) return token;
  if (!token) return country;
  return { minFiat: Math.max(country.minFiat, token.minFiat), maxFiat: Math.min(country.maxFiat, token.maxFiat) };
}

/** Reject buy quotes outside the country's configured fiat caps before Morapay. */
export function onrampAmountBoundsError(
  amount: string,
  currency: string,
  shop: Pick<ShopConfig, "countries">,
  token?: Pick<ShopToken, "ticker" | "buyCaps">,
): { code: string; message: string; status: number } | null {
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum)) return null;

  const currencyUpper = currency.toUpperCase();
  const country = shop.countries.list.find(
    (c) => c.currency.toUpperCase() === currencyUpper,
  );
  const caps = narrowCaps(country?.caps, token?.buyCaps?.[currencyUpper]);
  if (!caps) return null;

  if (amountNum < caps.minFiat) {
    return {
      code: "amount.below_min",
      message: belowMinimumAmountMessage(caps.minFiat, currencyUpper),
      status: 400,
    };
  }
  if (amountNum > caps.maxFiat) {
    return {
      code: "amount.above_max",
      message: `Amount must be at most ${caps.maxFiat} ${currencyUpper}.`,
      status: 400,
    };
  }
  return null;
}