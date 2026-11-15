import { describe, expect, it } from "vitest";
import { detectCountry } from "@/lib/geo";
import type { ShopConfig } from "@/config/schema";

const baseConfig = {
  countries: {
    default: "GH",
    list: [
      { code: "GH", enabled: true },
      { code: "NG", enabled: true },
    ],
  },
} as unknown as ShopConfig;

describe("detectCountry", () => {
  it("does not warn from Accept-Language en-US when defaulting to Ghana", () => {
    const result = detectCountry({
      headers: new Headers({ "accept-language": "en-US,en;q=0.9" }),
      config: baseConfig,
    });
    expect(result.code).toBe("GH");
    expect(result.note).toBeUndefined();
  });

  it("honors ?country= over language", () => {
    const result = detectCountry({
      queryCountry: "NG",
      headers: new Headers({ "accept-language": "en-US" }),
      config: baseConfig,
    });
    expect(result).toEqual({ code: "NG" });
  });

  it("warns only when IP geo is an unsupported country", () => {
    const result = detectCountry({
      headers: new Headers({ "cf-ipcountry": "US" }),
      config: baseConfig,
    });
    expect(result.code).toBe("GH");
    expect(result.note).toMatch(/US/);
  });

  it("uses IP country when supported", () => {
    const result = detectCountry({
      headers: new Headers({ "cf-ipcountry": "GH" }),
      acceptLanguage: "en-US",
      config: baseConfig,
    });
    expect(result).toEqual({ code: "GH" });
  });
});
