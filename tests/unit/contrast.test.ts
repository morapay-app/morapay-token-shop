import { describe, expect, it } from "vitest";
import { accentForLightText, contrastRatio } from "@/lib/contrast";

describe("accent contrast fallback", () => {
  it("darkens MILAN pink until AA on canvas", () => {
    const fixed = accentForLightText("#D91C7F", "#EFEEE2");
    expect(contrastRatio(fixed, "#EFEEE2")).toBeGreaterThanOrEqual(4.5);
  });
});
