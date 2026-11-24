import { existsSync } from "node:fs";
import path from "node:path";
export const ROOT_BRAND_FAVICON = "/brand/favicon.ico";

export type ResolvedBrandIcons = {
  icon:
    | string
    | Array<{ url: string; type?: string }>;
  shortcut: string;
  apple: string;
};

export type BrandIconInput = {
  favicon?: string;
};

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

/** Absolute path on disk for the resolved public favicon URL. */
export function resolveBrandFaviconFilePath(
  shopId: string,
  favicon?: string,
): string {
  const publicPath = resolveBrandFaviconPath(shopId, favicon);
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

/** Build-time Apple touch icon: per-shop PNG when present, else the favicon. */
export function resolveBrandAppleIconPath(
  shopId: string,
  fallback: string,
): string {
  const perShopFile = path.join(
    process.cwd(),
    "public",
    "brand",
    shopId,
    "apple-touch-icon.png",
  );
  return existsSync(perShopFile)
    ? `/brand/${shopId}/apple-touch-icon.png`
    : fallback;
}

/** Optional SVG favicon alongside the .ico (e.g. XRP). */
export function resolveBrandFaviconSvgPath(shopId: string): string | null {
  const perShopFile = path.join(
    process.cwd(),
    "public",
    "brand",
    shopId,
    "favicon.svg",
  );
  return existsSync(perShopFile) ? `/brand/${shopId}/favicon.svg` : null;
}

/** Next.js metadata.icons for the active shop (build-time via SHOP_ID). */
export function resolveBrandMetadataIcons(
  shopId: string,
  brand: BrandIconInput,
): ResolvedBrandIcons {
  const primary = resolveBrandFaviconPath(shopId, brand.favicon);
  const apple = resolveBrandAppleIconPath(shopId, primary);
  const svg = resolveBrandFaviconSvgPath(shopId);

  const icon: ResolvedBrandIcons["icon"] =
    svg != null
      ? [
          { url: svg, type: "image/svg+xml" },
          { url: primary, type: "image/x-icon" },
        ]
      : primary;

  return {
    icon,
    shortcut: primary,
    apple,
  };
}