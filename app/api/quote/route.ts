import { z } from "zod";
import { getQuote } from "@/lib/morapay/ramp";
import { getShopConfig } from "@/lib/shop-runtime";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  action: z.enum(["ONRAMP", "OFFRAMP"]).default("ONRAMP"),
  inputAmount: z.string().regex(/^\d+(\.\d+)?$/),
  inputCurrency: z.string().min(3).max(4),
  outputCurrency: z.string().optional(),
  chain: z.union([z.string(), z.number()]).optional(),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rl = await rateLimit(`quote:${ip}`, RL.quote.limit, RL.quote.windowMs);
    if (!rl.success) {
      return jsonErr(
        {
          message: "Too many quote requests. Please wait.",
          retryAfterSec: rl.retryAfterSec,
          status: 429,
        },
        429,
      );
    }

    const shop = getShopConfig();
    const body = BodySchema.parse(await req.json());

    if (body.action === "OFFRAMP") {
      const quote = await getQuote(
        {
          action: "OFFRAMP",
          inputAmount: body.inputAmount,
          inputCurrency: shop.token.ticker,
          outputCurrency: body.inputCurrency,
          chain: String(shop.token.chainId),
          tokenAddress: shop.token.contract,
        },
        { buyerIp: ip },
      );
      return jsonOk(quote);
    }

    const quote = await getQuote(
      {
        action: "ONRAMP",
        inputAmount: body.inputAmount,
        inputCurrency: body.inputCurrency,
        outputCurrency: shop.token.ticker,
        chain: String(shop.token.chainId),
        tokenAddress: shop.token.contract,
      },
      { buyerIp: ip },
    );
    return jsonOk(quote);
  } catch (err) {
    return jsonErr(err, 502);
  }
}
