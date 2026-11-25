import { z } from "zod";
import { resolveBankAccountName } from "@/lib/morapay/ramp";
import { asMorapayApiError } from "@/lib/morapay/client";
import { getShopConfig } from "@/lib/shop-runtime";
import { isNuban, shopCurrencies } from "@/lib/sell";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** POST, so account numbers stay out of access logs. */
const BodySchema = z.object({
  bankCode: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/),
  accountNumber: z.string().refine(isNuban),
});

function notFound() {
  return jsonErr(
    {
      code: "account.not_found",
      message: "Couldn't verify this account. Check the bank and number.",
      status: 422,
    },
    422,
  );
}

function unavailable() {
  return jsonErr(
    {
      code: "account.name.unavailable",
      message: "Name check is unavailable. Try again.",
      status: 503,
    },
    503,
  );
}

/** Name on a Nigerian bank account. Upstream messages name providers, so none are passed on. */
export async function POST(req: Request) {
  const shop = getShopConfig();
  if (!shop.sell.enabled || !shopCurrencies(shop).includes("NGN")) {
    return jsonErr({ code: "account.name.off", message: "Name check is not available.", status: 404 }, 404);
  }

  const ip = clientIp(req.headers);
  const rl = await rateLimit(`acct:${ip}`, RL.accountName.limit, RL.accountName.windowMs);
  if (!rl.success) {
    return jsonErr(
      {
        code: "rate.limited",
        message: "Too many checks. Wait a minute.",
        retryAfterSec: rl.retryAfterSec,
        status: 429,
      },
      429,
    );
  }

  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return jsonErr(
      {
        code: "account.invalid",
        message: "Choose a bank and enter a 10-digit number.",
        status: 400,
      },
      400,
    );
  }

  try {
    const accountName = await resolveBankAccountName(body.data, { buyerIp: ip });
    if (!accountName) return notFound();
    return jsonOk({ accountName });
  } catch (err) {
    const status = asMorapayApiError(err)?.status;
    // Core answers 500 when the bank does not know the account.
    const down = status == null || status === 429 || status > 500;
    return down ? unavailable() : notFound();
  }
}
