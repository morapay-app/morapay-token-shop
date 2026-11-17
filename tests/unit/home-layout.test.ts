import { describe, expect, it } from "vitest";
import amem from "@/examples/amem.config";
import milan from "@/examples/milan.config";
import wikicat from "@/examples/wikicat.config";
import { ShopConfigSchema } from "@/config/schema";
import { resolveHomeLayoutVariant } from "@/lib/home-layout";

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
});