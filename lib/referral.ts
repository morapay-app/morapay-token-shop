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
