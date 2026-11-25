/** NEXT_PUBLIC_SITE_URL when set, else the shop's own URL. */
export function envSiteUrl(fallback: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || fallback;
}
