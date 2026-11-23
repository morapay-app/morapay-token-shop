import type { ShopConfig } from "@/config/schema";

export type HomeLayoutVariant = "default" | "culture" | "wikicat" | "simple";

/** Which home shell to render — explicit variant wins over culture stage. */
export function resolveHomeLayoutVariant(cfg: ShopConfig): HomeLayoutVariant {
  if (cfg.brand.layoutVariant) return cfg.brand.layoutVariant;
  if (cfg.culture && cfg.culture.enabled !== false) return "culture";
  return "default";
}