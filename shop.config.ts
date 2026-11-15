/**
 * THE ONLY FILE A NEW SHOP EDITS (plus /public/brand/* and env vars).
 * Default example: MILAN from section 13.
 */
import milanConfig from "./examples/milan.config";
import { ShopConfigSchema, type ShopConfig } from "./config/schema";

const parsed = ShopConfigSchema.safeParse(milanConfig);

if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid shop.config.ts — fix schema errors before build");
}

export const shopConfig: ShopConfig = parsed.data;
export default shopConfig;
