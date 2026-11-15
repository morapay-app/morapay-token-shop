import { describe, expect, it } from "vitest";
import { interpretStatus } from "@/lib/morapay/status";

describe("status interpreter", () => {
  it("maps FAILED / CANCELLED", () => {
    expect(interpretStatus({ status: "FAILED" }).phase).toBe("failed");
    expect(interpretStatus({ status: "CANCELLED" }).phase).toBe("cancelled");
  });

  it("maps delivery FAILED after payment as delayed", () => {
    expect(
      interpretStatus({ status: "COMPLETED", deliveryStatus: "FAILED" }).phase,
    ).toBe("delayed");
  });

  it("maps in-progress and delivering", () => {
    expect(interpretStatus({ status: "PENDING" }).phase).toBe("in_progress");
    expect(
      interpretStatus({ status: "COMPLETED", deliveryStatus: "SENDING" }).phase,
    ).toBe("delivering");
    expect(
      interpretStatus({
        status: "COMPLETED",
        settlementMode: "HUB_SWAP",
        deliveryStatus: "PENDING",
      }).phase,
    ).toBe("delivering");
  });

  it("maps completed with txHash", () => {
    const r = interpretStatus({
      status: "COMPLETED",
      deliveryStatus: "COMPLETED",
      txHash: "0xabc",
    });
    expect(r.phase).toBe("completed");
    expect(r.txHash).toBe("0xabc");
  });
});
