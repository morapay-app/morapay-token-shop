import { z } from "zod";
import { getShopConfig } from "@/lib/shop-runtime";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  event: z.string().min(1).max(64),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const shop = getShopConfig();
    const body = BodySchema.parse(await req.json());
    // First-party sink — no PII; structured log only
    console.info(
      JSON.stringify({
        type: "shop_event",
        shopId: shop.shopId,
        event: body.event,
        meta: body.meta ?? {},
        at: new Date().toISOString(),
      }),
    );
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonErr(err, 400);
  }
}
