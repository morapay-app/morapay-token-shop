import { describe, expect, it, vi } from "vitest";
import { interpretStatus } from "@/lib/morapay/status";
import { buildReceipt } from "@/lib/morapay/receipt";

const BASE_HASH = `0x${"ab".repeat(32)}`;
const XRPL_HASH = "C152A52DFA6F57C178007866F07E8FB57B84CD7C3559F31F23A8620A41FF069B";
const tx = {
  direction: "onramp",
  status: "COMPLETED",
  currency: "ghs",
  customerAmount: "50.00",
  receiveAmount: "3.88",
  receiveCurrency: "XRP",
  receiveAmountEstimated: true,
  customer: { name: "Jane Doe", email: "jane@example.com", phone: "0540000000" },
  payment: { method: "mobile_money", network: "MTN", phoneNumber: "0540000000", instructions: "0540000000" },
  delivery: { status: "SWAPPING", txHash: BASE_HASH },
  createdAt: "2026-11-24T20:03:48.633Z",
};

vi.mock("@/lib/morapay/ramp", () => ({ getTransaction: async () => tx }));
vi.mock("@/lib/ratelimit", () => ({
  clientIp: () => "1.1.1.1",
  rateLimit: async () => ({ success: true }),
  RL: { status: { limit: 1, windowMs: 1 } },
}));

describe("order status", () => {
  it("a paid order whose delivery is still swapping is not complete", () => {
    expect(interpretStatus(tx).phase).toBe("delivering");
    expect(interpretStatus({ ...tx, delivery: { status: "COMPLETED", txHash: XRPL_HASH } })).toMatchObject({
      phase: "completed",
      txHash: XRPL_HASH,
    });
  });

  it("links each hash to its own chain", () => {
    const pending = buildReceipt("r", tx, "delivering", BASE_HASH, 144);
    expect(pending.deliveryTx).toBeNull();
    expect(pending.swapTx?.url).toBe(`https://basescan.org/tx/${BASE_HASH}`);
    const done = buildReceipt("r", tx, "completed", XRPL_HASH, 144);
    expect(done.deliveryTx?.url).toContain(`livenet.xrpl.org/transactions/${XRPL_HASH}`);
    expect(done.swapTx).toBeNull();
    expect(done).toMatchObject({ method: "MTN MoMo", paid: { amount: "50.00", currency: "GHS" } });
  });

  it("the public order route never returns customer details", async () => {
    const { GET } = await import("@/app/api/orders/[ref]/route");
    const res = await GET(new Request("https://shop.test/api/orders/r"), { params: Promise.resolve({ ref: "r" }) });
    const body = await res.text();
    expect(res.status).toBe(200);
    for (const secret of ["Jane", "jane@example.com", "0540000000", "customer\""]) expect(body).not.toContain(secret);
    expect(JSON.parse(body).data.receipt.received.amount).toBe("3.88");
  });
});
