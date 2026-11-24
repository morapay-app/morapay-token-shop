import { readFile } from "node:fs/promises";
import { shopConfig } from "@/shop.config";
import { resolveBrandFaviconFilePath } from "@/lib/brand-icon";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = resolveBrandFaviconFilePath(
    shopConfig.shopId,
    shopConfig.brand.favicon,
  );
  const body = await readFile(filePath);
  return new Response(body, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}