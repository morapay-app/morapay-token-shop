import { describe, expect, it } from "vitest";
import {
  accentForLightText,
  contrastRatio,
  textOnHero,
} from "@/lib/contrast";

describe("accent contrast fallback", () => {
  it("darkens MILAN pink until AA on canvas", () => {
    const fixed = accentForLightText("#D91C7F", "#EFEEE2");
    expect(contrastRatio(fixed, "#EFEEE2")).toBeGreaterThanOrEqual(4.5);
  });

  it("darkens MILAN pink until AA on Blue pebble canvas", () => {
    const fixed = accentForLightText("#D91C7F", "#D9DFE2");
    expect(contrastRatio(fixed, "#D9DFE2")).toBeGreaterThanOrEqual(4.5);
  });

  it("meets AA for default text tokens on Blue pebble canvas", () => {
    expect(contrastRatio("#2B0A30", "#D9DFE2")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#5C574C", "#D9DFE2")).toBeGreaterThanOrEqual(4.5);
  });

  it("uses cream on dark AMEM hero, plum on white", () => {
    expect(textOnHero("#0B3D2E")).toBe("#F8F6EC");
    expect(textOnHero("#FFFFFF")).toBe("#2B0A30");
  });
});
