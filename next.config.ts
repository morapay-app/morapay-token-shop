import type { NextConfig } from "next";
import { resolveBrandFaviconPath } from "./lib/brand-icon";
import shopConfig from "./shop.config";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://plausible.io",
      "frame-src https://challenges.cloudflare.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const brandFavicon = resolveBrandFaviconPath(
  shopConfig.shopId,
  shopConfig.brand.favicon,
);

const nextConfig: NextConfig = {
  output: "standalone",
  // Inline SHOP_ID into server + client bundles so shop.config.ts picks the same shop everywhere.
  env: { SHOP_ID: process.env.SHOP_ID ?? "" },
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/favicon.ico", destination: brandFavicon }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
