import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimitMemory, RL } from "@/lib/ratelimit";

vi.mock("@/lib/shop-runtime", async () => {
  const { ShopConfigSchema } = await import("@/config/schema");
  const { default: xrp } = await import("@/examples/xrp.config");
  return { getShopConfig: () => ShopConfigSchema.parse({ ...xrp, sell: { enabled: sellEnabled } }) };
});

let sellEnabled = true;
let upstream: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sellEnabled = true;
  __resetRateLimitMemory();
  delete process.env.UPSTASH_REDIS_REST_URL;
  upstream = vi.fn(async () =>
    Response.json({
      success: true,
      data: { account_number: "0123456789", account_name: "ADA OBI", bank_id: 9 },
    }),
  );
  vi.stubGlobal("fetch", upstream);
});
afterEach(() => vi.unstubAllGlobals());

async function post(body: unknown) {
  const { POST } = await import("@/app/api/institutions/resolve/route");
  const res = await POST(
    new Request("https://shop.test/api/institutions/resolve", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, json: await res.json() };
}

const GOOD = { bankCode: "058", accountNumber: "0123456789" };

describe("POST /api/institutions/resolve", { timeout: 20_000 }, () => {
  it("asks core for the name and returns nothing else", async () => {
    const { status, json } = await post(GOOD);
    expect(status).toBe(200);
    expect(json).toEqual({ success: true, data: { accountName: "ADA OBI" } });
    const url = new URL(String(upstream.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/public/ramp/banks/resolve");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      account_number: "0123456789",
      bank_code: "058",
    });
  });

  it("refuses bad input without calling core", async () => {
    for (const bad of [
      { ...GOOD, accountNumber: "012345678" },
      { ...GOOD, accountNumber: "024123456x" },
      { ...GOOD, bankCode: "058&x=1" },
      {},
      null,
    ]) {
      expect((await post(bad)).status).toBe(400);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  it("never passes on an upstream message", async () => {
    upstream.mockImplementation(async () =>
      Response.json({ success: false, error: "Paystack says no", code: "x" }, { status: 500 }),
    );
    const miss = await post(GOOD);
    expect(miss.status).toBe(422);
    expect(miss.json.message).toBe("Couldn't verify this account. Check the bank and number.");
    upstream.mockImplementation(async () =>
      Response.json({ success: false, error: "Paystack down" }, { status: 503 }),
    );
    const down = await post(GOOD);
    expect(down.status).toBe(503);
    expect(down.json.message).toBe("Name check is unavailable. Try again.");
    expect(JSON.stringify([miss, down])).not.toMatch(/paystack/i);
  });

  it("treats an empty name as not found", async () => {
    upstream.mockImplementation(async () =>
      Response.json({ success: true, data: { account_number: "", account_name: "" } }),
    );
    expect((await post(GOOD)).status).toBe(422);
  });

  it("limits each IP", async () => {
    for (let i = 0; i < RL.accountName.limit; i++) expect((await post(GOOD)).status).toBe(200);
    const limited = await post(GOOD);
    expect(limited.status).toBe(429);
    expect(limited.json.message).toBe("Too many checks. Wait a minute.");
    expect(upstream).toHaveBeenCalledTimes(RL.accountName.limit);
  });

  it("is closed where selling is off", async () => {
    sellEnabled = false;
    expect((await post(GOOD)).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
});
