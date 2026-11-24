import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import pi from "@/examples/pi.config";
import xrp from "@/examples/xrp.config";
import { ShopConfigSchema } from "@/config/schema";
import { contrastRatio } from "@/lib/contrast";
import { resolveHomeLayoutVariant } from "@/lib/home-layout";
import { PI_THEME as T } from "@/lib/pi-theme";

const PAIRS: Array<[string, string, string]> = [
  ["headline on stage", T.gold, T.stage],
  ["headline on stage end", T.gold, T.stageDeep],
  ["text on stage end", T.stageText, T.stageDeep],
  ["subline on stage end", T.stageMuted, T.stageDeep],
  ["text on card", T.text, T.card],
  ["text on subcard", T.text, T.subcard],
  ["text on canvas", T.text, T.canvas],
  ["muted on card", T.textMuted, T.card],
  ["muted on subcard", T.textMuted, T.subcard],
  ["muted on canvas", T.textMuted, T.canvas],
  ["selected pill", T.text, T.gold],
  ["unselected nav pill", T.text, T.pillInactive],
  ["pill", T.pillInactiveText, T.pillInactive],
  ["accent on canvas", T.pillInactiveText, T.canvas],
  ["button", T.buttonText, T.button],
  ["disabled button", T.disabledText, T.disabled],
  ["warning", T.warningText, T.warningBg],
  ["warning on card", T.warningText, T.card],
];

describe("pi theme", () => {
  it.each(PAIRS)("%s meets AA", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("stylesheet uses the tested colours", () => {
    const css = readFileSync("app/pi-theme.css", "utf8");
    for (const hex of Object.values(T)) expect(css).toContain(hex);
  });

  it("has its own layout, not the XRP shop's", () => {
    expect(resolveHomeLayoutVariant(ShopConfigSchema.parse(pi))).toBe("pi");
    expect(resolveHomeLayoutVariant(ShopConfigSchema.parse(xrp))).toBe("default");
  });
});
