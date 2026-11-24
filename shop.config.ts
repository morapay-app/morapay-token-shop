/**
 * THE ONLY FILE A NEW SHOP EDITS (plus /public/brand/* and env vars).
 *
 * Which shop is built is chosen by the SHOP_ID env var at build time (inlined via
 * next.config.ts `env`). A cloned shop either sets SHOP_ID to one of the bundled
 * examples below, or adds its own config here (copy an example or run `pnpm new-shop`).
 * Unknown / missing SHOP_ID falls back to the MILAN template example.
 */
import amemConfig from "./examples/amem.config";
import griotConfig from "./examples/griot.config";
import milanConfig from "./examples/milan.config";
import wikicatConfig from "./examples/wikicat.config";
import xrpConfig from "./examples/xrp.config";
import ipodConfig from "./examples/ipod.config";
import piConfig from "./examples/pi.config";
import { ShopConfigSchema, type ShopConfig } from "./config/schema";

const SHOPS: Record<string, unknown> = {
  [amemConfig.shopId]: amemConfig,
  [griotConfig.shopId]: griotConfig,
  [milanConfig.shopId]: milanConfig,
  [wikicatConfig.shopId]: wikicatConfig,
  [xrpConfig.shopId]: xrpConfig,
  [ipodConfig.shopId]: ipodConfig,
  [piConfig.shopId]: piConfig,
};

const selected = SHOPS[process.env.SHOP_ID ?? ""] ?? milanConfig;

const parsed = ShopConfigSchema.safeParse(selected);

if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid shop.config.ts — fix schema errors before build");
}

export const shopConfig: ShopConfig = parsed.data;
export default shopConfig;
