import { z } from "zod";
import { verifyOtp } from "@/lib/morapay/ramp";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  wallet_address: z.string().min(1),
  otp: z.string().regex(/^\d{4,8}$/),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ ref: string }> },
) {
  try {
    const { ref } = await ctx.params;
    const body = BodySchema.parse(await req.json());
    const data = await verifyOtp({
      wallet_address: body.wallet_address,
      merchant_reference: ref,
      otp: body.otp,
    });
    return jsonOk(data);
  } catch (err) {
    return jsonErr(err, 502);
  }
}
