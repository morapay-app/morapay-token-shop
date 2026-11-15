export type ShopEvent =
  | "quote_viewed"
  | "method_selected"
  | "order_started"
  | "momo_prompt_sent"
  | "otp_required"
  | "bank_details_shown"
  | "order_completed"
  | "order_failed"
  | "fallback_used"
  | "country_changed";

export type EventPayload = {
  event: ShopEvent;
  shopId: string;
  ref?: string;
  walletHash?: string;
  amountBucket?: string;
  code?: string;
  meta?: Record<string, string | number | boolean | undefined>;
};

export function amountBucket(amount: number): string {
  if (amount < 100) return "<100";
  if (amount < 500) return "100-499";
  if (amount < 2000) return "500-1999";
  return "2000+";
}

export async function hashWallet(wallet: string): Promise<string> {
  const data = new TextEncoder().encode(wallet.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/** Fire-and-forget client helper. */
export function track(event: ShopEvent, meta?: EventPayload["meta"]) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event, meta });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  } else {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  }
}
