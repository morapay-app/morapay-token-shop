import type { ShopConfig } from "@/config/schema";

function isCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Resolve shop country. Explicit query/saved win. IP geo can warn when
 * unsupported. Accept-Language is a soft preference only — never a warning
 * (e.g. en-US while the shopper is on Ghana must not say "US not supported").
 */
export function detectCountry(opts: {
  queryCountry?: string | null;
  savedCountry?: string | null;
  headers: Headers;
  acceptLanguage?: string | null;
  config: ShopConfig;
}): { code: string; note?: string } {
  const enabled = new Set(
    opts.config.countries.list.filter((c) => c.enabled).map((c) => c.code),
  );
  const fallback = opts.config.countries.default;

  const pickEnabled = (raw?: string | null): string | null => {
    if (!raw) return null;
    const code = raw.toUpperCase();
    return isCountryCode(code) && enabled.has(code) ? code : null;
  };

  const fromQuery = pickEnabled(opts.queryCountry);
  if (fromQuery) return { code: fromQuery };

  const fromSaved = pickEnabled(opts.savedCountry);
  if (fromSaved) return { code: fromSaved };

  const vercel = opts.headers.get("x-vercel-ip-country");
  const cf = opts.headers.get("cf-ipcountry");
  const ipRaw =
    (vercel && vercel.toUpperCase()) ||
    (cf && cf !== "XX" ? cf.toUpperCase() : null);

  if (ipRaw && isCountryCode(ipRaw)) {
    if (enabled.has(ipRaw)) return { code: ipRaw };
    return {
      code: fallback,
      note: `Morapay doesn't support payments from ${ipRaw} yet.`,
    };
  }

  const al = opts.acceptLanguage ?? opts.headers.get("accept-language");
  if (al) {
    const m = /[-_]([A-Za-z]{2})\b/.exec(al);
    const fromLang = pickEnabled(m?.[1] ?? null);
    if (fromLang) return { code: fromLang };
  }

  return { code: fallback };
}
