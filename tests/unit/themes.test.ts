import { describe, expect, it } from "vitest";
import amem from "@/examples/amem.config";
import milan from "@/examples/milan.config";
import wikicat from "@/examples/wikicat.config";
import ipod from "@/examples/ipod.config";
import { ShopConfigSchema } from "@/config/schema";
import pi from "@/examples/pi.config";
import { ogStage, resolveHomeLayoutVariant, resolveTheme, themeColor } from "@/config/themes";

describe("resolveHomeLayoutVariant", () => {
  it("uses culture for AMEM", () => {
    const cfg = ShopConfigSchema.parse(amem);
    expect(resolveHomeLayoutVariant(cfg)).toBe("culture");
  });

  it("uses default for MILAN", () => {
    const cfg = ShopConfigSchema.parse(milan);
    expect(resolveHomeLayoutVariant(cfg)).toBe("default");
  });

  it("uses wikicat property theme", () => {
    const cfg = ShopConfigSchema.parse(wikicat);
    expect(resolveHomeLayoutVariant(cfg)).toBe("wikicat");
  });

  it("uses simple hero for IPOD", () => {
    const cfg = ShopConfigSchema.parse(ipod);
    expect(resolveHomeLayoutVariant(cfg)).toBe("simple");
  });
});

describe("theme shells", () => {
  const theme = (cfg: unknown) => resolveTheme(ShopConfigSchema.parse(cfg));

  it("keeps each shop's page scope and header", () => {
    expect(theme(pi).pages.order).toEqual({ mainClass: "shop-pi", header: "pi" });
    expect(theme(wikicat).pages.sell).toEqual({ mainClass: "shop-wikicat", header: "plain" });
    expect(theme(ipod).pages.sell).toEqual({ mainClass: "shop-brand-hero", header: "simple" });
    expect(theme(milan).pages.home).toEqual({ header: "plain" });
    expect(theme(amem).pages.home.mainClass).toBe("shop-with-culture");
  });

  it("picks browser chrome and share colours", () => {
    const wiki = ShopConfigSchema.parse(wikicat);
    expect(themeColor({ ...wiki, brand: { ...wiki.brand, heroBg: undefined } })).toBe("#9DE7F1");
    expect(themeColor(ShopConfigSchema.parse(pi))).toBe(pi.brand.heroBg);
    expect(ogStage(wiki)).toEqual({ bg: "#9DE7F1", text: "#0A0A0A" });
    expect(ogStage(ShopConfigSchema.parse(milan))).toEqual({ bg: "#0A0A0A", text: "#F5F1E6" });
  });
});
