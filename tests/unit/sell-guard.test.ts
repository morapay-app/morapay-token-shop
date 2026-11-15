import { describe, expect, it } from "vitest";

const CONTRACT = "0x5C9Ff301Ec2d882B635813739cC07330788d7322";

function isUnsafeDeposit(depositAddress: string, contract: string) {
  return depositAddress.toLowerCase() === contract.toLowerCase();
}

describe("sell deposit-address guard", () => {
  it("flags deposit address equal to token contract", () => {
    expect(isUnsafeDeposit(CONTRACT, CONTRACT)).toBe(true);
    expect(
      isUnsafeDeposit("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", CONTRACT),
    ).toBe(false);
  });
});
