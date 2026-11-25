/**
 * Picks the shop to build from SHOP_ID (inlined at build time via next.config.ts `env`).
 * Adding a shop: put its config in examples/ and list it in SHOPS below. `pnpm new-shop`
 * does both. Unknown or missing SHOP_ID builds the MILAN template.
 */
import { ShopConfigSchema, type ShopConfig } from "./config/schema";
import amemConfig from "./examples/amem.config";
import griotConfig from "./examples/griot.config";
import ipodConfig from "./examples/ipod.config";
import milanConfig from "./examples/milan.config";
import piConfig from "./examples/pi.config";
import wikicatConfig from "./examples/wikicat.config";
import xrpConfig from "./examples/xrp.config";

const SHOPS = [
  amemConfig,
  griotConfig,
  ipodConfig,
  milanConfig,
  piConfig,
  wikicatConfig,
  xrpConfig,
];

const selected = SHOPS.find((s) => s.shopId === process.env.SHOP_ID) ?? milanConfig;

const parsed = ShopConfigSchema.safeParse(selected);

if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid shop.config.ts — fix schema errors before build");
}

export const shopConfig: ShopConfig = parsed.data;
export default shopConfig;
