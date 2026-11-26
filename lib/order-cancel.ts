import { createHmac, timingSafeEqual } from "node:crypto";
import { requireMerchantCredentials } from "@/lib/morapay/merchant-config";

/**
 * Server only. A cancel token proves the browser that opened the order is the one cancelling it:
 * an HMAC of the reference under the shop's merchant secret (never sent anywhere). The reference
 * alone is shown on the tracking page, so it is not enough.
 */
export function orderCancelToken(ref: string): string {
  const { secretKey } = requireMerchantCredentials();
  return createHmac("sha256", secretKey).update(`order-cancel:v1:${ref}`, "utf8").digest("hex").slice(0, 40);
}

/** For order-create answers: null when the shop runs without merchant keys (no cancel there). */
export function orderCancelTokenOrNull(ref: string): string | null {
  try {
    return orderCancelToken(ref);
  } catch {
    return null;
  }
}

export function orderCancelTokenValid(ref: string, token: unknown): boolean {
  if (typeof token !== "string" || token.length !== 40) return false;
  let expected: string;
  try {
    expected = orderCancelToken(ref);
  } catch {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/** Only these Core states can still be cancelled (unpaid, nothing delivered). */
export function isCancellableOrder(tx: {
  status?: unknown;
  deliveryStatus?: unknown;
  distributionStatus?: unknown;
  delivery?: { status?: unknown } | null;
}): boolean {
  const status = String(tx.status ?? "").toUpperCase();
  if (status !== "INITIATED" && status !== "PENDING") return false;
  const delivery = String(tx.deliveryStatus ?? tx.delivery?.status ?? tx.distributionStatus ?? "NONE").toUpperCase();
  return delivery === "NONE" || delivery === "PENDING";
}
