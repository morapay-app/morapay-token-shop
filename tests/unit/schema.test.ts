import { describe, expect, it } from "vitest";
import {
  ShopConfigSchema,
  lintShopConfig,
  type ShopConfigInput,
} from "@/config/schema";
import milan from "@/examples/milan.config";

function base(): ShopConfigInput {
  return structuredClone(milan) as ShopConfigInput;
}

describe("config schema", () => {
  it("accepts the MILAN example", () => {
    const r = ShopConfigSchema.safeParse(milan);
    expect(r.success).toBe(true);
  });

  it("rejects a bad referral format", () => {
    const cfg = base();
    cfg.attribution = { referralCode: "BAD" as never };
    const r = ShopConfigSchema.safeParse(cfg);
    expect(r.success).toBe(false);
  });

  it("rejects a missing desk URL", () => {
    const cfg = base();
    cfg.telegram = { deskUrl: "not-a-url" };
    const r = ShopConfigSchema.safeParse(cfg);
    expect(r.success).toBe(false);
  });

  it("rejects empty contract", () => {
    const cfg = base();
    cfg.token.contract = "";
    const r = ShopConfigSchema.safeParse(cfg);
    expect(r.success).toBe(false);
  });

  it("copy lint fails on banned words", () => {
    const cfg = base();
    cfg.brand.headline = "To the moon with MILAN";
    const hits = lintShopConfig(cfg);
    expect(hits.length).toBeGreaterThan(0);
  });

  it("MILAN example has clean copy", () => {
    expect(lintShopConfig(milan)).toEqual([]);
  });
});
