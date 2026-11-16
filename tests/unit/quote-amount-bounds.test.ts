import { describe, expect, it } from "vitest";
import { onrampAmountBoundsError } from "@/lib/quote-amount-bounds";
import milanConfig from "@/examples/milan.config";

describe("onrampAmountBoundsError", () => {
  it("returns below-min copy from shop caps", () => {
    expect(onrampAmountBoundsError("10", "GHS", milanConfig)).toMatchObject({
      code: "amount.below_min",
      message: "Enter at least 50 GHS.",
      status: 400,
    });
  });

  it("accepts amounts within caps", () => {
    expect(onrampAmountBoundsError("100", "GHS", milanConfig)).toBeNull();
  });
});