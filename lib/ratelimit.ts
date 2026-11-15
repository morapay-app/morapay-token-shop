type Bucket = { timestamps: number[] };

const memory = new Map<string, Bucket>();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfterSec: number;
};

function prune(bucket: Bucket, windowMs: number, now: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
}

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    const windowSec = Math.ceil(windowMs / 1000);
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "morapay-shop",
    });
    const res = await rl.limit(key);
    const retryAfterSec = res.success
      ? 0
      : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return {
      success: res.success,
      remaining: res.remaining,
      reset: res.reset,
      retryAfterSec,
    };
  } catch {
    return null;
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let bucket = memory.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    memory.set(key, bucket);
  }
  prune(bucket, windowMs, now);
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      remaining: 0,
      reset: oldest + windowMs,
      retryAfterSec,
    };
  }
  bucket.timestamps.push(now);
  return {
    success: true,
    remaining: limit - bucket.timestamps.length,
    reset: now + windowMs,
    retryAfterSec: 0,
  };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const up = await upstashLimit(key, limit, windowMs);
  if (up) return up;
  return memoryLimit(key, limit, windowMs);
}

/** Quotes: 30/min. Orders: 5 per 10 min. Status: 60/min. */
export const RL = {
  quote: { limit: 30, windowMs: 60_000 },
  order: { limit: 5, windowMs: 10 * 60_000 },
  status: { limit: 60, windowMs: 60_000 },
} as const;

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Test helper — clear in-memory buckets. */
export function __resetRateLimitMemory() {
  memory.clear();
}
