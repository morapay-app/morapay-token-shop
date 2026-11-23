import { describe, expect, it } from "vitest";
import {
  ShopConfigSchema,
  lintShopConfig,
  type ShopConfigInput,
} from "@/config/schema";
import milan from "@/examples/milan.config";
import wikicat from "@/examples/wikicat.config";
import ipod from "@/examples/ipod.config";
import xrp from "@/examples/xrp.config";

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

  it("accepts the WikiCat example", () => {
    const r = ShopConfigSchema.safeParse(wikicat);
    expect(r.success).toBe(true);
  });

  it("WikiCat example has clean copy", () => {
    expect(lintShopConfig(wikicat)).toEqual([]);
  });

  it("accepts the XRP example with native contract id", () => {
    const r = ShopConfigSchema.safeParse(xrp);
    expect(r.success).toBe(true);
  });

  it("rejects wrong native contract on XRPL", () => {
    const cfg = structuredClone(xrp) as ShopConfigInput;
    cfg.token.contract = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const r = ShopConfigSchema.safeParse(cfg);
    expect(r.success).toBe(false);
  });

  it("accepts the IPOD example", () => {
    expect(ShopConfigSchema.safeParse(ipod).success).toBe(true);
  });

  it("IPOD example has clean copy", () => {
    expect(lintShopConfig(ipod)).toEqual([]);
  });
});
