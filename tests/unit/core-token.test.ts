import { describe, expect, it } from "vitest";
import { merchantCoreTokenAddress } from "@/lib/morapay/core-token";

describe("merchantCoreTokenAddress", () => {
  it("omits native XRP on XRPL", () => {
    expect(merchantCoreTokenAddress(144, "xrp")).toBeUndefined();
    expect(merchantCoreTokenAddress(144, "XRP")).toBeUndefined();
  });

  it("omits short native ids", () => {
    expect(merchantCoreTokenAddress(56, "short")).toBeUndefined();
  });

  it("passes EVM contracts through", () => {
    const c = "0x5C9Ff301Ec2d882B635813739cC07330788d7322";
    expect(merchantCoreTokenAddress(56, c)).toBe(c);
  });
});