/** Client-safe cancel rules and copy (the server decides; Core has the final say). */

/** Offer "Cancel onramp" / "Cancel offramp" once an unpaid order has waited this long. */
export const ORDER_CANCEL_OFFER_AFTER_MS = 10 * 60 * 1000;

export type OrderDirection = "buy" | "sell";

export function orderCancelCopy(direction: OrderDirection) {
  const noun = direction === "buy" ? "onramp" : "offramp";
  return {
    button: `Cancel ${noun}`,
    title: `Cancel this ${noun}?`,
    body: "Only cancel if you have not paid. If a payment arrives later we'll refund it.",
    keep: "Keep order",
    confirm: `Cancel ${noun}`,
    tooltip: "We check with the payment provider first. Paid orders can't be cancelled.",
  };
}

/** Where the browser keeps an order's cancel token (set when the order opens). */
export function orderCancelStorageKey(ref: string): string {
  return `mp_cancel:${ref}`;
}

export type StoredCancel = { token: string; openedAt: number; direction: OrderDirection };

export function saveOrderCancel(ref: string, token: unknown, direction: OrderDirection): void {
  if (typeof token !== "string" || !token) return;
  try {
    const record: StoredCancel = { token, openedAt: Date.now(), direction };
    localStorage.setItem(orderCancelStorageKey(ref), JSON.stringify(record));
  } catch {
    /* private mode: no cancel button on this device */
  }
}

export function readOrderCancel(ref: string): StoredCancel | null {
  try {
    const raw = localStorage.getItem(orderCancelStorageKey(ref));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCancel>;
    if (typeof parsed.token !== "string" || typeof parsed.openedAt !== "number") return null;
    if (parsed.direction !== "buy" && parsed.direction !== "sell") return null;
    return parsed as StoredCancel;
  } catch {
    return null;
  }
}

export function canOfferOrderCancel(input: { openedAt: number; now: number; cancellable: boolean }): boolean {
  return input.cancellable && input.now - input.openedAt >= ORDER_CANCEL_OFFER_AFTER_MS;
}
