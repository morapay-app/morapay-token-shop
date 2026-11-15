export const REFERRAL_COOKIE = "mp_ref";
export const REFERRAL_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const REFERRAL_RE = /^MP-[A-Z0-9]{6}$/;

export function isValidReferral(code: string | null | undefined): code is string {
  return !!code && REFERRAL_RE.test(code);
}

/**
 * Precedence: ?ref= (or referral / referral_code) > /r/CODE cookie already set
 * > MORAPAY_REFERRAL_CODE env > config.
 */
export function resolveReferral(opts: {
  query?: string | null;
  cookie?: string | null;
  env?: string | null;
  config?: string | null;
}): string | undefined {
  if (isValidReferral(opts.query)) return opts.query;
  if (isValidReferral(opts.cookie)) return opts.cookie;
  if (isValidReferral(opts.env)) return opts.env;
  if (isValidReferral(opts.config)) return opts.config;
  return undefined;
}

export function extractQueryReferral(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): string | undefined {
  const get = (k: string) => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(k);
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };
  for (const key of ["ref", "referral", "referral_code"]) {
    const v = get(key);
    if (isValidReferral(v)) return v;
  }
  return undefined;
}
