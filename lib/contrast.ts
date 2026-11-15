/** Relative luminance (sRGB). */
export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

function mixToward(hex: string, toward: string, t: number): string {
  const parse = (h: string) => {
    const x = h.replace("#", "");
    return [
      parseInt(x.slice(0, 2), 16),
      parseInt(x.slice(2, 4), 16),
      parseInt(x.slice(4, 6), 16),
    ] as const;
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(toward);
  const ch = (a: number, b: number) =>
    Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
}

/**
 * Ensure accent used as text on a light surface meets WCAG AA (4.5:1).
 * Darkens toward plum if needed.
 */
export function accentForLightText(
  accent: string,
  background = "#EFEEE2",
  minRatio = 4.5,
): string {
  let color = accent;
  let i = 0;
  while (contrastRatio(color, background) < minRatio && i < 12) {
    color = mixToward(color, "#2B0A30", 0.18);
    i += 1;
  }
  return color;
}
