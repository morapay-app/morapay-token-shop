import { describe, expect, it } from "vitest";
import {
  ROOT_BRAND_FAVICON,
  resolveBrandFaviconPath,
  resolveBrandMetadataIcons,
} from "@/lib/brand-icon";

describe("resolveBrandFaviconPath", () => {
  it("uses root favicon for shops without a per-shop file", () => {
    expect(resolveBrandFaviconPath("milanthepug")).toBe(ROOT_BRAND_FAVICON);
    expect(resolveBrandFaviconPath("theafricanmeme")).toBe(ROOT_BRAND_FAVICON);
  });

  it("uses public/brand/<shopId>/favicon.ico when present", () => {
    expect(resolveBrandFaviconPath("wikicat")).toBe("/brand/wikicat/favicon.ico");
    expect(resolveBrandFaviconPath("xrp")).toBe("/brand/xrp/favicon.ico");
    expect(resolveBrandFaviconPath("ipod")).toBe("/brand/ipod/favicon.ico");
  });

  it("prefers explicit favicon over auto-detect", () => {
    expect(resolveBrandFaviconPath("wikicat", "/brand/custom.ico")).toBe(
      "/brand/custom.ico",
    );
    expect(
      resolveBrandFaviconPath("theafricanmeme", "/brand/favicon.ico"),
    ).toBe("/brand/favicon.ico");
  });
});

describe("resolveBrandMetadataIcons", () => {
  it("serves AMEM root favicon for theafricanmeme", () => {
    const icons = resolveBrandMetadataIcons("theafricanmeme", {
      favicon: "/brand/favicon.ico",
    });
    expect(icons.shortcut).toBe("/brand/favicon.ico");
    expect(icons.apple).toBe("/brand/favicon.ico");
  });

  it("includes SVG + ICO for XRP", () => {
    const icons = resolveBrandMetadataIcons("xrp", {
      favicon: "/brand/xrp/favicon.ico",
    });
    expect(icons.shortcut).toBe("/brand/xrp/favicon.ico");
    expect(icons.apple).toBe("/brand/xrp/apple-touch-icon.png");
    expect(icons.icon).toEqual([
      { url: "/brand/xrp/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/xrp/favicon.ico", type: "image/x-icon" },
    ]);
  });

  it("uses per-shop ICO for WikiCat and IPOD", () => {
    expect(
      resolveBrandMetadataIcons("wikicat", {
        favicon: "/brand/wikicat/favicon.ico",
      }).shortcut,
    ).toBe("/brand/wikicat/favicon.ico");
    expect(
      resolveBrandMetadataIcons("ipod", {
        favicon: "/brand/ipod/favicon.ico",
      }).shortcut,
    ).toBe("/brand/ipod/favicon.ico");
  });
});