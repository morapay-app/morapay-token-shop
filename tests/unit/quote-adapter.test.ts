import { describe, expect, it } from "vitest";
import { buildQuoteBody, QuoteSchema } from "@/lib/morapay/ramp";
import { mapEnvelopeError } from "@/lib/morapay/client";
import { quoteFixture } from "../mocks/morapay";

describe("quote adapter", () => {
  it("sends chain as a string", () => {
    const body = buildQuoteBody({
      action: "ONRAMP",
      inputAmount: "100",
      inputCurrency: "GHS",
      outputCurrency: "MILAN",
      chain: 56,
    });
    expect(body.chain).toBe("56");
    expect(typeof body.chain).toBe("string");
  });

  it("parses the 100 GHS → MILAN fixture", () => {
    const q = QuoteSchema.parse(quoteFixture);
    expect(Number(q.output.amount)).toBeCloseTo(65462.75, 2);
  });
});

describe("error mapper", () => {
  it("prefers displayMessage then safeMessage then generic", () => {
    expect(
      mapEnvelopeError(
        {
          success: false,
          displayMessage: "Shown",
          safeMessage: "Safe",
        },
        400,
      ).message,
    ).toBe("Shown");
    expect(
      mapEnvelopeError({ success: false, safeMessage: "Safe" }, 400).message,
    ).toBe("Safe");
    const g = mapEnvelopeError(
      { success: false, requestId: "req_1" },
      500,
    );
    expect(g.message).toMatch(/try again/i);
    expect(g.requestId).toBe("req_1");
  });
});
