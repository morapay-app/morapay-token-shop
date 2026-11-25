import type { ShopConfig } from "./schema";

export type HomeLayoutVariant = NonNullable<ShopConfig["brand"]["layoutVariant"]>;
export type HeaderStyle = "plain" | "culture" | "wikicat" | "simple" | "pi";
export type ShellPage = "home" | "sell" | "order";

type PageShell = {
  /** Class on <main>; scopes app/themes/*.css. */
  mainClass?: string;
  header: HeaderStyle;
};

export type ShopTheme = {
  pages: Record<ShellPage, PageShell>;
  /** Browser chrome colour when the shop sets no heroBg. */
  themeColor: string;
  /** The culture stage colour wins over heroBg for browser chrome. */
  usesCultureStage: boolean;
  /** Share image when the shop has no culture stage of its own. */
  og: { bg: string; text: string; usesCultureStage: boolean };
};

const plain: PageShell = { header: "plain" };
const DARK_OG = { bg: "#0A0A0A", text: "#F5F1E6", usesCultureStage: true };

const base: ShopTheme = {
  pages: { home: plain, sell: plain, order: plain },
  themeColor: "#ffffff",
  usesCultureStage: true,
  og: DARK_OG,
};

/** One entry per brand.layoutVariant. Home markup lives in components/themes/. */
export const THEMES: Record<HomeLayoutVariant, ShopTheme> = {
  default: base,
  culture: {
    ...base,
    pages: { ...base.pages, home: { mainClass: "shop-with-culture", header: "culture" } },
  },
  wikicat: {
    ...base,
    pages: {
      home: { mainClass: "shop-wikicat", header: "wikicat" },
      sell: { mainClass: "shop-wikicat", header: "plain" },
      order: plain,
    },
    themeColor: "#9DE7F1",
    usesCultureStage: false,
    og: { bg: "#9DE7F1", text: "#0A0A0A", usesCultureStage: false },
  },
  simple: {
    ...base,
    pages: {
      home: { mainClass: "shop-brand-hero", header: "simple" },
      sell: { mainClass: "shop-brand-hero", header: "simple" },
      order: plain,
    },
    usesCultureStage: false,
  },
  pi: {
    ...base,
    pages: {
      home: { mainClass: "shop-pi", header: "pi" },
      sell: { mainClass: "shop-pi", header: "pi" },
      order: { mainClass: "shop-pi", header: "pi" },
    },
  },
};

/** Which home shell to render — explicit variant wins over culture stage. */
export function resolveHomeLayoutVariant(cfg: ShopConfig): HomeLayoutVariant {
  if (cfg.brand.layoutVariant) return cfg.brand.layoutVariant;
  if (cfg.culture && cfg.culture.enabled !== false) return "culture";
  return "default";
}

export function resolveTheme(cfg: ShopConfig): ShopTheme {
  return THEMES[resolveHomeLayoutVariant(cfg)];
}

export function themeColor(cfg: ShopConfig): string {
  const theme = resolveTheme(cfg);
  const stage = theme.usesCultureStage ? cfg.culture?.stageBg : undefined;
  return stage ?? cfg.brand.heroBg ?? theme.themeColor;
}

export function ogStage(cfg: ShopConfig): { bg: string; text: string } {
  const { og } = resolveTheme(cfg);
  if (!og.usesCultureStage) return { bg: og.bg, text: og.text };
  return { bg: cfg.culture?.stageBg ?? og.bg, text: cfg.culture?.stageText ?? og.text };
}
