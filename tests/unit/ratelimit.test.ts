import { describe, expect, it, beforeEach } from "vitest";
import { rateLimit, __resetRateLimitMemory } from "@/lib/ratelimit";

describe("in-memory rate limit", () => {
  beforeEach(() => {
    __resetRateLimitMemory();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("blocks the 6th order in the window", async () => {
    const key = "order:test-ip";
    for (let i = 0; i < 5; i++) {
      const r = await rateLimit(key, 5, 10 * 60_000);
      expect(r.success).toBe(true);
    }
    const sixth = await rateLimit(key, 5, 10 * 60_000);
    expect(sixth.success).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
  });
});
