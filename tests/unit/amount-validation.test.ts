import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimitMemory } from "@/lib/ratelimit";
import { isPositiveAmountString } from "@/lib/validate/amount";

vi.mock("@/lib/shop-runtime", async () => {
  const { ShopConfigSchema } = await import("@/config/schema");
  const { default: xrp } = await import("@/examples/xrp.config");
  return {
    getShopConfig: () => ShopConfigSchema.parse({ ...xrp, sell: { enabled: true } }),
    getHealth: async () => ({ fallback: false }),
  };
});

const BAD = ["-1", "-0", "0", "0.00", "1e3", "Infinity", "NaN", " 5 ", "0x10", "", "5abc", "1".repeat(41)];

let upstream: ReturnType<typeof vi.fn>;
beforeEach(() => {
  __resetRateLimitMemory();
  delete process.env.UPSTASH_REDIS_REST_URL;
  upstream = vi.fn(async () => Response.json({ success: false }, { status: 500 }));
  vi.stubGlobal("fetch", upstream);
});
afterEach(() => vi.unstubAllGlobals());

async function post(path: "quote" | "orders" | "sell", body: unknown) {
  const mod =
    path === "quote"
      ? await import("@/app/api/quote/route")
      : path === "orders"
        ? await import("@/app/api/orders/route")
        : await import("@/app/api/sell/route");
  const res = await mod.POST(
    new Request(`https://shop.test/api/${path}`, {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.10", "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, json: await res.json() };
}

describe("isPositiveAmountString", () => {
  it.each(BAD)("refuses %j", (raw) => expect(isPositiveAmountString(raw)).toBe(false));
  it.each(["1", "0.5", "1500.25"])("accepts %j", (raw) => expect(isPositiveAmountString(raw)).toBe(true));
});

describe("amount routes answer 400, never 5xx, and never call core", { timeout: 20_000 }, () => {
  it.each(BAD)("POST /api/quote inputAmount %j", async (inputAmount) => {
    const { status, json } = await post("quote", { inputAmount, inputCurrency: "GHS" });
    expect(status).toBe(400);
    expect(json.message).toBe("Amount must be a positive number");
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(["-1", "0", "1e3", "0x10"])("POST /api/orders fiatAmount %j", async (fiatAmount) => {
    const { status } = await post("orders", {
      fiatAmount,
      currency: "GHS",
      country: "GH",
      methodId: "momo",
      methodKind: "mobile_money",
      walletAddress: "rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh",
    });
    expect(status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(["-1", "0", "1e3", "0x10"])("POST /api/sell tokenAmount %j", async (tokenAmount) => {
    const { status } = await post("sell", {
      tokenAmount,
      currency: "GHS",
      walletAddress: "rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh",
      bankCode: "MTN",
      accountNumber: "0241234567",
    });
    expect(status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
