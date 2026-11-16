import { belowMinimumAmountMessage } from "@/lib/quote-client-message";
import type { ShopConfig } from "@/config/schema";

/** Reject buy quotes outside the country's configured fiat caps before Morapay. */
export function onrampAmountBoundsError(
  amount: string,
  currency: string,
  shop: Pick<ShopConfig, "countries">,
): { code: string; message: string; status: number } | null {
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum)) return null;

  const currencyUpper = currency.toUpperCase();
  const country = shop.countries.list.find(
    (c) => c.currency.toUpperCase() === currencyUpper,
  );
  const caps = country?.caps;
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