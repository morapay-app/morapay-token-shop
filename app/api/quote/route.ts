import { z } from "zod";
import { getQuote } from "@/lib/morapay/ramp";
import { asMorapayApiError, isMorapayApiError } from "@/lib/morapay/client";
import { getShopConfig, resolveRequestToken } from "@/lib/shop-runtime";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { bodyIssue, zPositiveAmount } from "@/lib/validate/amount";
import { onrampAmountBoundsError } from "@/lib/quote-amount-bounds";
import { sellAmountError } from "@/lib/sell";
import {
  isBelowMinimumQuoteError,
  quoteClientMessage,
} from "@/lib/quote-client-message";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  action: z.enum(["ONRAMP", "OFFRAMP"]).default("ONRAMP"),
  inputAmount: zPositiveAmount,
  inputCurrency: z.string().min(3).max(4),
  outputCurrency: z.string().optional(),
  chain: z.union([z.string(), z.number()]).optional(),
  /** Ticker of one of this shop's tokens; omitted = the primary token. Chain/contract come from config. */
  token: z.string().max(16).optional(),
});

export async function POST(req: Request) {
  let inputCurrency: string | undefined;
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
    const parsedBody = BodySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return jsonErr({ ...bodyIssue(parsedBody.error), status: 400 }, 400);
    }
    const body = parsedBody.data;
    inputCurrency = body.inputCurrency;

    const resolved = await resolveRequestToken(body.token, body.action === "OFFRAMP" ? "sell" : "buy");
    if (!resolved.ok) {
      return jsonErr({ code: resolved.code, message: resolved.message, status: resolved.status }, resolved.status);
    }
    const token = resolved.token;

    if (body.action === "ONRAMP") {
      const boundsErr = onrampAmountBoundsError(
        body.inputAmount,
        body.inputCurrency,
        shop,
        token,
      );
      if (boundsErr) {
        return jsonErr(boundsErr, boundsErr.status);
      }
    }

    if (body.action === "OFFRAMP") {
      // Extra tokens carry their own sell range (thin pools); the primary keeps its old behaviour.
      const sellErr = token.primary ? null : sellAmountError(body.inputAmount, shop, token);
      if (sellErr) return jsonErr({ code: "amount.out_of_range", message: sellErr, status: 400 }, 400);
      const quote = await getQuote(
        {
          action: "OFFRAMP",
          inputAmount: body.inputAmount,
          inputCurrency: token.ticker,
          outputCurrency: body.inputCurrency,
          chain: String(token.chainId),
          tokenAddress: token.contract,
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
        outputCurrency: token.ticker,
        chain: String(token.chainId),
        tokenAddress: token.contract,
      },
      { buyerIp: ip },
    );
    return jsonOk(quote);
  } catch (err) {
    const morapay = asMorapayApiError(err);
    const status = morapay?.status ?? 502;
    if (isMorapayApiError(err) && morapay) {
      const currency = inputCurrency?.toUpperCase();
      const country = currency
        ? getShopConfig().countries.list.find(
            (c) => c.currency.toUpperCase() === currency,
          )
        : undefined;
      const message = isBelowMinimumQuoteError(morapay.code, morapay.message)
        ? quoteClientMessage(morapay.code, morapay.message, {
            minFiat: country?.caps?.minFiat,
            currency,
          })
        : morapay.message;
      return jsonErr(
        {
          message,
          code: morapay.code,
          requestId: morapay.requestId,
          status,
        },
        status,
      );
    }
    return jsonErr(err, status);
  }
}
