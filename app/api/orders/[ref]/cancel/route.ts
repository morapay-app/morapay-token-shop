import { NextResponse } from "next/server";
import { cancelMerchantOrder } from "@/lib/morapay/cancel";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { orderCancelTokenValid } from "@/lib/order-cancel";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const REF_PATTERN = /^[A-Za-z0-9_.:-]{4,128}$/;

function fail(status: number, message: string, code?: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

/**
 * Customer cancel of an unpaid order, through Core's merchant cancel with this shop's key.
 * Needs the order's cancel token (handed to the browser that opened it). Answers only the
 * reference and the outcome: never the order itself (it carries the customer's details).
 */
export async function POST(req: Request, ctx: { params: Promise<{ ref: string }> }) {
  try {
    const { ref } = await ctx.params;
    if (!REF_PATTERN.test(ref)) return fail(404, "Order not found");
    const ip = clientIp(req.headers);
    for (const [key, rule] of [
      [`cancel:ip:${ip}`, RL.cancelIp],
      [`cancel:ref:${ref}`, RL.cancelOrder],
    ] as const) {
      const rl = await rateLimit(key, rule.limit, rule.windowMs);
      if (!rl.success) {
        return NextResponse.json(
          { success: false, message: "Too many requests. Try again shortly.", retryAfterSec: rl.retryAfterSec },
          { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
        );
      }
    }
    let body: { token?: unknown } = {};
    try {
      body = (await req.json()) as { token?: unknown };
    } catch {
      body = {};
    }
    // A wrong or missing token looks like an unknown order.
    if (!orderCancelTokenValid(ref, body?.token)) return fail(404, "Order not found");

    const result = await cancelMerchantOrder(ref, { buyerIp: ip });
    if (!result.ok) return fail(result.status, result.message, result.code);
    return jsonOk({ ref, phase: "cancelled" as const });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
