import type { ShopConfig, PaymentMethod, CountryConfig } from "@/config/schema";
import type { RampConfig } from "@/lib/morapay/ramp";

export type MergedMethod = PaymentMethod & {
  selectable: boolean;
  comingSoon: boolean;
};

export type MergedCountry = {
  code: string;
  currency: string;
  enabledInConfig: boolean;
  liveSupported: boolean;
  selectable: boolean;
  quickAmounts?: number[];
  caps?: CountryConfig["caps"];
  methods: MergedMethod[];
  buyLimits?: { minFiat: number; maxFiat: number };
};

function corridorFor(live: RampConfig, currency: string) {
  const cur = currency.toLowerCase();
  return live.fiatCorridors.find((c) => c.currency.toLowerCase() === cur);
}

/**
 * Method is selectable only if config.enabled AND currency in live
 * supportedCurrencies AND method kind in corridor onrampPaymentMethods.
 */
export function mergeCountries(
  shop: ShopConfig,
  live: RampConfig | null,
  direction: "buy" | "sell" = "buy",
): MergedCountry[] {
  const supported = new Set(
    (live?.supportedCurrencies ?? []).map((c) => c.toLowerCase()),
  );

  return shop.countries.list.map((country) => {
    const corridor = live ? corridorFor(live, country.currency) : undefined;
    const liveSupported = supported.has(country.currency.toLowerCase());
    const methodList =
      direction === "buy"
        ? corridor?.onrampPaymentMethods ?? []
        : corridor?.offrampPayoutMethods ?? [];
    const liveMethods = new Set(methodList.map((m) => m.toLowerCase()));

    const methods: MergedMethod[] = country.methods.map((m) => {
      const kindLive = liveMethods.has(m.kind);
      const selectable =
        country.enabled && m.enabled && liveSupported && kindLive;
      return {
        ...m,
        selectable,
        comingSoon: !selectable,
      };
    });

    let buyLimits = country.caps
      ? { minFiat: country.caps.minFiat, maxFiat: country.caps.maxFiat }
      : undefined;
    if (corridor?.buyLimits && buyLimits) {
      buyLimits = {
        minFiat: Math.max(buyLimits.minFiat, corridor.buyLimits.minFiat),
        maxFiat: Math.min(buyLimits.maxFiat, corridor.buyLimits.maxFiat),
      };
    } else if (corridor?.buyLimits) {
      buyLimits = { ...corridor.buyLimits };
    }

    return {
      code: country.code,
      currency: country.currency,
      enabledInConfig: country.enabled,
      liveSupported,
      selectable: country.enabled && liveSupported,
      quickAmounts: country.quickAmounts,
      caps: country.caps,
      methods,
      buyLimits,
    };
  });
}
