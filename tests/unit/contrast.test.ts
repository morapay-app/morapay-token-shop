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

  it("uses cream on dark AMEM hero, plum on white", () => {
    expect(textOnHero("#0B3D2E")).toBe("#F8F6EC");
    expect(textOnHero("#FFFFFF")).toBe("#2B0A30");
  });
});
