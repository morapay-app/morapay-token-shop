import { afterEach, describe, expect, it } from "vitest";
import { morapayBuyerIpHeaders, resolveBuyerIp } from "@/lib/morapay/buyer-ip";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("buyer IP", () => {
  it("prefers X-Forwarded-For by default", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });
    expect(resolveBuyerIp(headers)).toBe("203.0.113.10");
  });

  it("uses CF-Connecting-IP only when trusted", () => {
    process.env.TRUST_CLOUDFLARE_IP = "true";
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.5",
      "x-forwarded-for": "203.0.113.10",
    });
    expect(resolveBuyerIp(headers)).toBe("198.51.100.5");
  });

  it("forwards buyer IP headers to Morapay", () => {
    expect(morapayBuyerIpHeaders("203.0.113.10")).toEqual({
      "X-Forwarded-For": "203.0.113.10",
      "X-Real-IP": "203.0.113.10",
      "Morapay-Client-Ip": "203.0.113.10",
    });
  });
});