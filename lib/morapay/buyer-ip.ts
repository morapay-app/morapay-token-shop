/**
 * Resolve the shopper's IP for Morapay ramp abuse guards.
 * Trust CF-Connecting-IP only when the shop runs behind Cloudflare.
 */
export function resolveBuyerIp(headers: Headers): string {
  const trustCf =
    process.env.TRUST_CLOUDFLARE_IP === "true" ||
    process.env.CF_PAGES === "1" ||
    process.env.CF_WORKER === "1";

  if (trustCf) {
    const cf = headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
  }

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;

  return "unknown";
}

/** Headers to forward the buyer IP to Morapay (server egress must not be used alone). */
export function morapayBuyerIpHeaders(buyerIp: string): Record<string, string> {
  if (!buyerIp || buyerIp === "unknown") return {};
  return {
    "X-Forwarded-For": buyerIp,
    "X-Real-IP": buyerIp,
    "Morapay-Client-Ip": buyerIp,
  };
}