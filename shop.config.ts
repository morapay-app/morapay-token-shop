/**
 * THE ONLY FILE A NEW SHOP EDITS (plus /public/brand/* and env vars).
 * Live shop: AMEM (The African Meme).
 */
import amemConfig from "./examples/amem.config";
import { ShopConfigSchema, type ShopConfig } from "./config/schema";

const parsed = ShopConfigSchema.safeParse(amemConfig);

if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid shop.config.ts — fix schema errors before build");
}

export const shopConfig: ShopConfig = parsed.data;
export default shopConfig;
