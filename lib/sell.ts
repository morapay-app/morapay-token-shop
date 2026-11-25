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
  TELECEL: "Telecel Cash (Vodafone)",
  AIRTEL: "AirtelTigo (Airtel)",
  TIGO: "AirtelTigo (Tigo)",
  AIRTELTIGO: "AirtelTigo Money",
};

const MOMO_SUFFIX = /\s+(mobile money|momo|money|cash)$/i;

/** Drops a routing code the rail put in a name: "MTN (0004)", "GTBank - 058", "058 GTBank". */
function stripCode(name: string, code: string): string {
  const escaped = code.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return name.trim();
  return name
    .replace(new RegExp(`\\s*[([]\\s*(?:code\\s*)?${escaped}\\s*[)\\]]`, "gi"), "")
    .replace(new RegExp(`\\s*[-–—:|/]\\s*${escaped}\\s*$`, "i"), "")
    .replace(new RegExp(`^${escaped}\\s*[-–—:|/]?\\s+`, "i"), "")
    .trim();
}

/** What the customer sees: the name only, never the code. */
export function institutionLabel(i: SellInstitution): string {
  const name = stripCode(i.name, i.code);
  if (i.kind !== "mobile_money") return name;
  return MOMO_LABELS[name.replace(MOMO_SUFFIX, "").replace(/\s+/g, "").toUpperCase()] ?? name;
}

/** Payment providers are never named to customers, even where one runs a bank of its own. */
const PROVIDER_NAME = /paystack|quidax|pollar/i;

/** Entries we can show: named (not just a code) and not a payment provider. */
export function listedInstitutions(list: SellInstitution[]): SellInstitution[] {
  return list.filter((i) => {
    const label = institutionLabel(i);
    return /\p{L}/u.test(label) && label !== i.code && !PROVIDER_NAME.test(label);
  });
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Every typed word must appear in the shown name or the issued name; codes never match. */
export function searchInstitutions(list: SellInstitution[], query: string): SellInstitution[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((i) => {
    const haystack = fold(`${institutionLabel(i)} ${stripCode(i.name, i.code)}`);
    return words.every((w) => haystack.includes(w));
  });
}

/** Name enquiry is Nigeria-only (NUBAN); cedi payouts are verified by core during the order. */
export function needsAccountName(currency: string): boolean {
  return currency.toUpperCase() === "NGN";
}

export const NUBAN_LENGTH = 10;

export function isNuban(account: string): boolean {
  return account.length === NUBAN_LENGTH && /^\d+$/.test(account);
}
