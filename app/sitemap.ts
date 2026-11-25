import type { MetadataRoute } from "next";
import { envSiteUrl } from "@/lib/site-url";
import { shopConfig } from "@/shop.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = envSiteUrl(shopConfig.siteUrl);
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
