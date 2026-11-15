import { describe, expect, it } from "vitest";
import { buildDeskDeepLink } from "@/lib/telegram";

describe("telegram deep link", () => {
  it("includes amount, ticker, contract and wallet", () => {
    const url = buildDeskDeepLink({
      deskUrl: "https://t.me/morapay",
      amount: "100",
      currency: "GHS",
      ticker: "MILAN",
      chainName: "BNB Chain",
      contract: "0x5C9Ff301Ec2d882B635813739cC07330788d7322",
      wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      method: "momo_mtn",
      shopId: "milanthepug",
      referral: "MP-TEST01",
    });
    expect(url).toContain("t.me/morapay");
    const text = decodeURIComponent(url.split("text=")[1]!);
    expect(text).toContain("100 GHS");
    expect(text).toContain("$MILAN");
    expect(text).toContain("0x5C9Ff301Ec2d882B635813739cC07330788d7322");
    expect(text).toContain("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
  });
});
