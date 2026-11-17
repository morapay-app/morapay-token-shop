import { existsSync } from "node:fs";
import path from "node:path";

export const ROOT_BRAND_FAVICON = "/brand/favicon.ico";

/** Build-time favicon path: explicit config → per-shop file → root default. */
export function resolveBrandFaviconPath(
  shopId: string,
  favicon?: string,
): string {
  if (favicon) return favicon;

  const perShopFile = path.join(
    process.cwd(),
    "public",
    "brand",
    shopId,
    "favicon.ico",
  );
  if (existsSync(perShopFile)) {
    return `/brand/${shopId}/favicon.ico`;
  }
  return ROOT_BRAND_FAVICON;
}