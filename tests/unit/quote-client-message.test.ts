import { describe, expect, it } from "vitest";
import { quoteClientMessage } from "@/lib/quote-client-message";

describe("quoteClientMessage", () => {
  it("uses shop min when Morapay signals below-minimum", () => {
    expect(
      quoteClientMessage("ramp.quote.minimum", "Request failed", {
        minFiat: 50,
        currency: "GHS",
      }),
    ).toBe("Amount is below the minimum. Enter at least 50 GHS.");
  });

  it("keeps API copy for below-minimum when limits are unknown", () => {
    expect(
      quoteClientMessage(undefined, "Amount is below the minimum buy amount."),
    ).toBe("Amount is below the minimum buy amount.");
  });
});