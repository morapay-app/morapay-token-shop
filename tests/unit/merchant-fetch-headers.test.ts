import { afterEach, describe, expect, it, vi } from "vitest";
import { morapayFetch } from "@/lib/morapay/client";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
  vi.restoreAllMocks();
});

describe("morapayFetch signing headers", () => {
  it("attaches Morapay signature headers on merchant calls", async () => {
    process.env.MORAPAY_MERCHANT_PUBLIC_KEY = "pk_test_sign";
    process.env.MORAPAY_MERCHANT_SECRET_KEY = "sk_test_sign";
    process.env.MORAPAY_ENV = "test";

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers["Morapay-Key"]).toBe("pk_test_sign");
      expect(headers["Morapay-Timestamp"]).toMatch(/^\d+$/);
      expect(headers["Morapay-Signature"]).toMatch(/^v1=[a-f0-9]{64}$/);
      expect(headers["X-Forwarded-For"]).toBe("203.0.113.44");
      return new Response(
        JSON.stringify({ success: true, data: { ok: true } }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await morapayFetch("/api/v1/merchant/ramp/config", {
      buyerIp: "203.0.113.44",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});