import { describe, expect, it } from "vitest";
import { mergeCountries } from "@/lib/merge-methods";
import { ShopConfigSchema } from "@/config/schema";
import milan from "@/examples/milan.config";
import { rampConfigFixture } from "../mocks/morapay";
import type { RampConfig } from "@/lib/morapay/ramp";

const shop = ShopConfigSchema.parse(milan);

describe("method merge (config ∩ live)", () => {
  it("enables GH MoMo + bank and NG bank; others coming soon", () => {
    const merged = mergeCountries(shop, rampConfigFixture as RampConfig);
    const gh = merged.find((c) => c.code === "GH")!;
    const ng = merged.find((c) => c.code === "NG")!;
    const ke = merged.find((c) => c.code === "KE")!;

    expect(gh.selectable).toBe(true);
    expect(gh.methods.filter((m) => m.selectable).map((m) => m.id).sort()).toEqual(
      ["bank_transfer", "momo_airteltigo", "momo_mtn", "momo_telecel"].sort(),
    );
    expect(ng.methods.filter((m) => m.selectable).map((m) => m.id)).toEqual([
      "bank_transfer",
    ]);
    expect(ke.selectable).toBe(false);
    expect(ke.methods.every((m) => m.comingSoon)).toBe(true);
  });

  it("disables MoMo when live corridor drops mobile_money", () => {
    const live: RampConfig = {
      ...rampConfigFixture,
      fiatCorridors: rampConfigFixture.fiatCorridors.map((c) =>
        c.currency === "ghs"
          ? { ...c, onrampPaymentMethods: ["bank_transfer"] }
          : c,
      ),
    };
    const gh = mergeCountries(shop, live).find((c) => c.code === "GH")!;
    expect(gh.methods.find((m) => m.id === "momo_mtn")?.selectable).toBe(false);
    expect(gh.methods.find((m) => m.id === "bank_transfer")?.selectable).toBe(
      true,
    );
  });
});
