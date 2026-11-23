import type { ShopConfig } from "@/config/schema";

export type SellInstitution = { code: string; name: string; kind: string };

/** Shop-level floor and ceiling. Core still enforces the live value limits on the quote. */
export function sellAmountError(amount: string, shop: ShopConfig): string | null {
  const value = Number(amount);
  if (!/^\d+(\.\d+)?$/.test(amount) || !(value > 0)) return "Enter an amount.";
  const { minToken, maxToken } = shop.sell;
  const ticker = shop.token.ticker;
  if (minToken != null && value < minToken) return `Minimum sell amount is ${minToken} ${ticker}`;
  if (maxToken != null && value > maxToken) return `Maximum sell amount is ${maxToken} ${ticker}`;
  return null;
}

/** Currencies this shop pays out in, in config order. */
export function shopCurrencies(shop: ShopConfig): string[] {
  return [
    ...new Set(
      shop.countries.list.filter((c) => c.enabled).map((c) => c.currency.toUpperCase()),
    ),
  ];
}

/** Mobile money first (most common in Ghana), then banks by name. */
export function sortInstitutions(list: SellInstitution[]): SellInstitution[] {
  return [...list].sort((a, b) => {
    const rank = (i: SellInstitution) => (i.kind === "mobile_money" ? 0 : 1);
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}

/** Empty until the customer picks one: a wrong default sends money to the wrong network. */
export function keepInstitution(current: string, list: SellInstitution[]): string {
  return list.some((i) => i.code === current) ? current : "";
}

/** Current Ghana network names; the codes stay exactly as issued. */
const MOMO_LABELS: Record<string, string> = {
  MTN: "MTN MoMo",
  VODAFONE: "Telecel Cash (Vodafone)",
  AIRTEL: "AirtelTigo (Airtel)",
  TIGO: "AirtelTigo (Tigo)",
};

export function institutionLabel(i: SellInstitution): string {
  return (i.kind === "mobile_money" && MOMO_LABELS[i.name.trim().toUpperCase()]) || i.name;
}
