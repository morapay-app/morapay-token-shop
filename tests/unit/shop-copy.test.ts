import { describe, expect, it } from "vitest";
import milan from "@/examples/milan.config";
import pi from "@/examples/pi.config";
import { ShopConfigSchema } from "@/config/schema";
import { faqItems, riskText } from "@/lib/shop-copy";

const answer = (cfg: unknown, q: string) =>
  faqItems(ShopConfigSchema.parse(cfg)).find((i) => i.q === q)?.a;

describe("shop copy", () => {
  it("uses community wording by default", () => {
    expect(answer(milan, "Who runs this site?")).toBe(
      "The $MILAN community, using Morapay’s payment service.",
    );
    expect(riskText(ShopConfigSchema.parse(milan))).toContain("run by the MILAN community");
  });

  it("uses the shop's own wording and its chain's wallet answer", () => {
    expect(answer(pi, "Who runs this site?")).toBe("Morapay.");
    expect(answer(pi, "Which wallet do I need?")).toBe(
      "A Pi Network wallet. Its address starts with G.",
    );
    expect(riskText(ShopConfigSchema.parse(pi))).toContain("not affiliated with Pi Network");
  });
});
