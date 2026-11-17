import { describe, expect, it } from "vitest";
import {
  ROOT_BRAND_FAVICON,
  resolveBrandFaviconPath,
} from "@/lib/brand-icon";

describe("resolveBrandFaviconPath", () => {
  it("uses root favicon for shops without a per-shop file", () => {
    expect(resolveBrandFaviconPath("milanthepug")).toBe(ROOT_BRAND_FAVICON);
  });

  it("uses public/brand/<shopId>/favicon.ico when present", () => {
    expect(resolveBrandFaviconPath("wikicat")).toBe("/brand/wikicat/favicon.ico");
  });

  it("prefers explicit favicon over auto-detect", () => {
    expect(resolveBrandFaviconPath("wikicat", "/brand/custom.ico")).toBe(
      "/brand/custom.ico",
    );
  });
});