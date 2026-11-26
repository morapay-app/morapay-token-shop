// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCancellableOrder, orderCancelToken, orderCancelTokenOrNull, orderCancelTokenValid } from "@/lib/order-cancel";
import { cancelMerchantOrder } from "@/lib/morapay/cancel";
import { canOfferOrderCancel, ORDER_CANCEL_OFFER_AFTER_MS, orderCancelCopy } from "@/lib/order-cancel-copy";
import { __resetRateLimitMemory } from "@/lib/ratelimit";
import { POST } from "@/app/api/orders/[ref]/cancel/route";

const env = process.env;
const PAID = "Payment already received; this order can't be cancelled";

beforeEach(() => {
  process.env = { ...env, MORAPAY_MERCHANT_PUBLIC_KEY: "pk_test_cancel", MORAPAY_MERCHANT_SECRET_KEY: "sk_test_cancel", MORAPAY_ENV: "test" };
  __resetRateLimitMemory();
});
afterEach(() => {
  process.env = { ...env };
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function v2(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function cancelRequest(ref: string, token: unknown, ip = "203.0.113.9") {
  return POST(
    new Request(`https://shop.test/api/orders/${ref}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ token }),
    }),
    { params: Promise.resolve({ ref }) },
  );
}

describe("order cancel token", () => {
  it("is bound to the order and the shop secret, and fails closed without keys", () => {
    const token = orderCancelToken("morapay_ref_1");
    expect(token).toMatch(/^[a-f0-9]{40}$/);
    expect(orderCancelTokenValid("morapay_ref_1", token)).toBe(true);
    expect(orderCancelTokenValid("morapay_ref_2", token)).toBe(false);
    expect(orderCancelTokenValid("morapay_ref_1", "x")).toBe(false);
    expect(orderCancelTokenValid("morapay_ref_1", undefined)).toBe(false);
    process.env.MORAPAY_MERCHANT_SECRET_KEY = "";
    expect(orderCancelTokenOrNull("morapay_ref_1")).toBeNull();
    expect(orderCancelTokenValid("morapay_ref_1", token)).toBe(false);
  });

  it("only INITIATED / PENDING orders with no delivery started are cancellable", () => {
    expect(isCancellableOrder({ status: "PENDING", distributionStatus: "PENDING" })).toBe(true);
    expect(isCancellableOrder({ status: "INITIATED" })).toBe(true);
    for (const status of ["PROCESSING", "COMPLETED", "FAILED", "CANCELLED", ""]) expect(isCancellableOrder({ status })).toBe(false);
    expect(isCancellableOrder({ status: "PENDING", deliveryStatus: "SENDING" })).toBe(false);
  });

  it("offers the button after 10 minutes, with copy by direction", () => {
    expect(ORDER_CANCEL_OFFER_AFTER_MS).toBe(600_000);
    expect(canOfferOrderCancel({ openedAt: 0, now: 599_999, cancellable: true })).toBe(false);
    expect(canOfferOrderCancel({ openedAt: 0, now: 600_000, cancellable: true })).toBe(true);
    expect(canOfferOrderCancel({ openedAt: 0, now: 600_000, cancellable: false })).toBe(false);
    expect(orderCancelCopy("buy")).toMatchObject({ button: "Cancel onramp", title: "Cancel this onramp?", keep: "Keep order" });
    expect(orderCancelCopy("sell").confirm).toBe("Cancel offramp");
  });
});

describe("cancelMerchantOrder (Core merchant v2)", () => {
  it("signs POST /v2/buys/{ref}/cancel with an Idempotency-Key", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => v2(200, { data: { reference: "R1", status: "cancelled" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await cancelMerchantOrder("R1", { buyerIp: "203.0.113.9" })).toEqual({ ok: true, direction: "buy" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/v2\/buys\/R1\/cancel$/);
    const headers = init!.headers as Record<string, string>;
    expect(headers["Morapay-Key"]).toBe("pk_test_cancel");
    expect(headers["Morapay-Signature"]).toMatch(/^v1=[a-f0-9]{64}$/);
    expect(headers["Idempotency-Key"]).toMatch(/^shop-cancel-[a-f0-9-]{36}$/);
    expect(JSON.stringify(headers)).not.toContain("sk_test_cancel");
  });

  it("tries the sell route when it is not a buy, and passes Core's one-line refusal through", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(v2(404, { error: { code: "resource.not_found" } }))
      .mockResolvedValueOnce(v2(409, { error: { code: "resource.conflict", details: [{ field: "order", code: "cancel_paid", message: PAID }] } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await cancelMerchantOrder("R2")).toEqual({ ok: false, status: 409, message: PAID, code: "cancel_paid" });
    expect(String(fetchMock.mock.calls[1]![0])).toMatch(/\/v2\/sells\/R2\/cancel$/);
  });

  it("answers not found when neither direction knows the order", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => v2(404, { error: { code: "resource.not_found" } })));
    expect(await cancelMerchantOrder("R3")).toEqual({ ok: false, status: 404, message: "Order not found" });
  });
});

describe("POST /api/orders/[ref]/cancel", () => {
  it("cancels with the order's token and answers only the reference and the outcome", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => v2(200, { data: { reference: "R1", status: "cancelled" } })));
    const res = await cancelRequest("R1abc", orderCancelToken("R1abc"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { ref: "R1abc", phase: "cancelled" } });
  });

  it("a missing or wrong token is 404 and never reaches Core", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await cancelRequest("R1abc", "nope")).status).toBe(404);
    expect((await cancelRequest("R1abc", orderCancelToken("other-ref"))).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes Core's 409 line through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => v2(409, { error: { code: "resource.conflict", details: [{ field: "order", code: "cancel_paid", message: PAID }] } })),
    );
    const res = await cancelRequest("R1abc", orderCancelToken("R1abc"));
    expect(res.status).toBe(409);
    expect((await res.json()).message).toBe(PAID);
  });

  it("rate-limits per order", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => v2(200, { data: { reference: "R1", status: "cancelled" } })));
    const token = orderCancelToken("R9abc");
    let last = 200;
    for (let i = 0; i < 7; i += 1) last = (await cancelRequest("R9abc", token, `203.0.113.${i + 20}`)).status;
    expect(last).toBe(429);
  });
});
