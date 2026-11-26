import { describe, expect, it } from "vitest";
import { toClientError } from "@/lib/morapay/client";

describe("toClientError", () => {
  it("keeps a route's own 4xx refusal message", () => {
    expect(toClientError({ message: "Amount must be between 50 and 1500 GHS.", status: 400 }).message).toBe(
      "Amount must be between 50 and 1500 GHS.",
    );
    expect(toClientError({ message: "Phone number is required.", status: 400 }).message).toBe("Phone number is required.");
  });

  it("stays generic for thrown errors, 5xx and malformed input", () => {
    const generic = "Something went wrong. Please try again.";
    expect(toClientError(new Error("ECONNREFUSED 10.0.0.5:5432")).message).toBe(generic);
    expect(toClientError({ message: "upstream exploded", status: 502 }).message).toBe(generic);
    expect(toClientError({ message: "no status" }).message).toBe(generic);
    expect(toClientError("text").message).toBe(generic);
  });
});
