import type { MetadataRoute } from "next";
import { envSiteUrl } from "@/lib/site-url";
import { shopConfig } from "@/shop.config";

export default function robots(): MetadataRoute.Robots {
  const base = envSiteUrl(shopConfig.siteUrl);
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
