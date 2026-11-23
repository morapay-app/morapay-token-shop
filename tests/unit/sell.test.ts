import { describe, expect, it } from "vitest";
import xrpConfig from "@/examples/xrp.config";
import { ShopConfigSchema } from "@/config/schema";
import { institutionLabel, keepInstitution, sellAmountError, shopCurrencies, sortInstitutions } from "@/lib/sell";

const shop = ShopConfigSchema.parse(xrpConfig);

describe("XRP shop currencies", () => {
  it("offers cedis first and naira second, with Ghana as the default", () => {
    expect(shopCurrencies(shop)).toEqual(["GHS", "NGN"]);
    expect(shop.countries.default).toBe("GH");
  });

  it("offers every Ghana mobile network", () => {
    const gh = shop.countries.list.find((c) => c.code === "GH");
    expect(gh?.methods.filter((m) => m.kind === "mobile_money").map((m) => m.institutionCode)).toEqual([
      "0004", "0006", "0005",
    ]);
  });

  it("leaves out disabled countries", () => {
    const one = {
      ...shop,
      countries: {
        ...shop.countries,
        list: shop.countries.list.map((c) => ({ ...c, enabled: c.code === "GH" })),
      },
    };
    expect(shopCurrencies(one)).toEqual(["GHS"]);
  });
});

describe("sellAmountError", () => {
  it("applies the shop limits", () => {
    expect(sellAmountError("4.99", shop)).toBe("Minimum sell amount is 5 XRP");
    expect(sellAmountError("7000.1", shop)).toBe("Maximum sell amount is 7000 XRP");
    expect(sellAmountError("5", shop)).toBeNull();
  });

  it("refuses anything that is not a positive number", () => {
    for (const bad of ["", "0", "1e5", "-5", "5.", ".5", "abc"]) {
      expect(sellAmountError(bad, shop)).not.toBeNull();
    }
  });
});

describe("institutions", () => {
  const list = [
    { code: "B2", name: "Zenith", kind: "bank" },
    { code: "B1", name: "Absa", kind: "bank" },
    { code: "0004", name: "MTN", kind: "mobile_money" },
  ];

  it("lists mobile money before banks", () => {
    expect(sortInstitutions(list).map((i) => i.code)).toEqual(["0004", "B1", "B2"]);
  });

  it("shows current network names without touching banks", () => {
    expect(institutionLabel({ code: "0006", name: "VODAFONE", kind: "mobile_money" })).toBe("Telecel Cash (Vodafone)");
    expect(institutionLabel({ code: "B1", name: "Tigo", kind: "bank" })).toBe("Tigo");
  });

  it("never keeps a network from another currency", () => {
    expect(keepInstitution("0004", list)).toBe("0004");
    expect(keepInstitution("0004", [{ code: "058", name: "GTB", kind: "bank" }])).toBe("");
  });
});
