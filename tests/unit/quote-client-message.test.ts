import { describe, expect, it } from "vitest";
import {
  isBelowMinimumQuoteError,
  quoteClientMessage,
} from "@/lib/quote-client-message";

describe("quoteClientMessage", () => {
  it("uses shop min when Morapay signals below-minimum", () => {
    expect(
      quoteClientMessage("ramp.quote.minimum", "Request failed", {
        minFiat: 50,
        currency: "GHS",
      }),
    ).toBe("Enter at least 50 GHS.");
  });

  it("maps ramp.limit to configured min copy", () => {
    expect(
      quoteClientMessage("ramp.limit", "Minimum buy amount is 50 GHS", {
        minFiat: 50,
        currency: "GHS",
      }),
    ).toBe("Enter at least 50 GHS.");
    expect(isBelowMinimumQuoteError("ramp.limit", "Minimum buy amount is 50 GHS")).toBe(
      true,
    );
  });

  it("keeps API copy for below-minimum when limits are unknown", () => {
    expect(
      quoteClientMessage(undefined, "Amount is below the minimum buy amount."),
    ).toBe("Amount is below the minimum buy amount.");
  });
});