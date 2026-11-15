import type { MetadataRoute } from "next";
import { shopConfig } from "@/shop.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || shopConfig.siteUrl;
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/legal/terms`, lastModified: new Date() },
    { url: `${base}/legal/privacy`, lastModified: new Date() },
  ];
  if (shopConfig.sell.enabled) {
    entries.push({ url: `${base}/sell`, lastModified: new Date() });
  }
  return entries;
}
