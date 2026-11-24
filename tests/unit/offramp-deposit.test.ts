import { describe, expect, it } from "vitest";
import {
  mergeOfframpDeposit,
  offrampDepositError,
  parseOfframpDeposit,
} from "@/lib/morapay/offramp-deposit";
import { parseOfframpDepositInfo } from "@/lib/morapay/ramp";
import { PI_CHAIN_ID } from "@/config/chains";

const PI_ADDR = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

describe("offramp deposit adapter", () => {
  it("maps nested deposit.{address,memo,amount}", () => {
    expect(
      parseOfframpDeposit({
        amount: "500",
        deposit: { address: PI_ADDR, memo: "K7Q2M9XA", amount: "12.3456789", expiresAt: "2026-11-24T12:00:00Z" },
      }),
    ).toEqual({
      depositAddress: PI_ADDR,
      depositMemo: "K7Q2M9XA",
      depositAmount: "12.3456789",
      depositExpiresAt: "2026-11-24T12:00:00Z",
    });
  });

  it("maps top-level depositMemo / depositAmount", () => {
    const d = parseOfframpDeposit({ depositAddress: PI_ADDR, depositMemo: "ABC123", depositAmount: "5" });
    expect(d).toMatchObject({ depositAddress: PI_ADDR, depositMemo: "ABC123", depositAmount: "5" });
  });

  it("accepts plain `memo` and snake_case", () => {
    expect(parseOfframpDeposit({ deposit_address: PI_ADDR, memo: "M1" }).depositMemo).toBe("M1");
    expect(parseOfframpDeposit({ deposit_address: PI_ADDR, deposit_memo: "M2" })).toMatchObject({
      depositAddress: PI_ADDR,
      depositMemo: "M2",
    });
  });

  it("does not read the order's top-level amount as the deposit amount", () => {
    expect(parseOfframpDeposit({ depositAddress: PI_ADDR, amount: "500" }).depositAmount).toBeUndefined();
  });

  it("keeps the XRP destination tag mapping", () => {
    expect(
      parseOfframpDeposit({ deposit: { address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", destinationTag: 424242 } }),
    ).toEqual({ depositAddress: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", depositDestinationTag: 424242 });
    expect(
      parseOfframpDeposit({ depositAddress: "rX", deposit_destination_tag: "7" }).depositDestinationTag,
    ).toBe("7");
  });

  it("fills memo from the initiate response when the transaction read lacks it", () => {
    const merged = parseOfframpDepositInfo(
      { depositAddress: PI_ADDR },
      { deposit: { address: PI_ADDR, memo: "FROMINIT", amount: "3.5" } },
    );
    expect(merged).toMatchObject({ depositAddress: PI_ADDR, depositMemo: "FROMINIT", depositAmount: "3.5" });
    expect(mergeOfframpDeposit({ depositAddress: "" }, { depositAddress: PI_ADDR }).depositAddress).toBe(PI_ADDR);
  });

  it("refuses Pi deposits without address or memo", () => {
    expect(offrampDepositError(PI_CHAIN_ID, { depositAddress: "" })).toMatch(/address/i);
    expect(offrampDepositError(PI_CHAIN_ID, { depositAddress: PI_ADDR })).toMatch(/memo/i);
    expect(
      offrampDepositError(PI_CHAIN_ID, { depositAddress: PI_ADDR, depositMemo: "X".repeat(29) }),
    ).toMatch(/memo/i);
    expect(offrampDepositError(PI_CHAIN_ID, { depositAddress: PI_ADDR, depositMemo: "K7Q2M9XA" })).toBeNull();
  });

  it("leaves XRP and EVM checks as before", () => {
    expect(offrampDepositError(144, { depositAddress: "rX" })).toMatch(/tag/i);
    expect(offrampDepositError(144, { depositAddress: "rX", depositDestinationTag: 1 })).toBeNull();
    expect(offrampDepositError(56, { depositAddress: "0xabc" })).toBeNull();
  });
});
