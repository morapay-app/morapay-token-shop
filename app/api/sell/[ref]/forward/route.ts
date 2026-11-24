import { z } from "zod";
import { hubForward } from "@/lib/morapay/ramp";
import { getShopConfig } from "@/lib/shop-runtime";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  wallet_address: z.string().min(1),
  deposit_tx_hash: z.string().min(1),
});

/** UNVERIFIED hub-forward adapter — only when sell is enabled. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ ref: string }> },
) {
  try {
    const shop = getShopConfig();
    if (!shop.sell.enabled) {
      return jsonErr({ message: "Sell is not enabled.", status: 403 }, 403);
    }
    const { ref } = await ctx.params;
    const body = BodySchema.parse(await req.json());
    await hubForward(ref, body, { buyerIp: clientIp(req.headers) });
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
