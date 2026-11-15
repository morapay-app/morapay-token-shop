import type { ShopConfig } from "@/config/schema";

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

  const candidates: string[] = [];
  if (opts.queryCountry) candidates.push(opts.queryCountry.toUpperCase());
  if (opts.savedCountry) candidates.push(opts.savedCountry.toUpperCase());

  const vercel = opts.headers.get("x-vercel-ip-country");
  const cf = opts.headers.get("cf-ipcountry");
  if (vercel) candidates.push(vercel.toUpperCase());
  if (cf && cf !== "XX") candidates.push(cf.toUpperCase());

  const al = opts.acceptLanguage ?? opts.headers.get("accept-language");
  if (al) {
    const m = /[-_]([A-Za-z]{2})\b/.exec(al);
    if (m?.[1]) candidates.push(m[1].toUpperCase());
  }

  for (const code of candidates) {
    if (enabled.has(code)) return { code };
    if (/^[A-Z]{2}$/.test(code) && !enabled.has(code)) {
      return {
        code: fallback,
        note: `Morapay doesn't support payments from ${code} yet.`,
      };
    }
  }

  return { code: fallback };
}
