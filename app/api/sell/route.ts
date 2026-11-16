import { z } from "zod";
import { cookies } from "next/headers";
import {
  getQuote,
  initiateOfframp,
  confirmOfframp,
} from "@/lib/morapay/ramp";
import { getShopConfig, getHealth } from "@/lib/shop-runtime";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";
import { validateWalletAddress } from "@/lib/validate/address";
import { REFERRAL_COOKIE, resolveReferral } from "@/lib/referral";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  tokenAmount: z.string().regex(/^\d+(\.\d+)?$/),
  currency: z.string().min(3).max(4),
  walletAddress: z.string().min(1),
  bankCode: z.string().min(1),
  accountNumber: z.string().min(1),
  customerName: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const shop = getShopConfig();
    if (!shop.sell.enabled) {
      return jsonErr({ message: "Sell is not enabled for this shop.", status: 403 }, 403);
    }

    const health = await getHealth();
    if (health.fallback) {
      return jsonErr(
        { code: "fallback", message: "Sell is temporarily unavailable.", status: 503 },
        503,
      );
    }

    const ip = clientIp(req.headers);
    const rl = await rateLimit(`sell:${ip}`, RL.order.limit, RL.order.windowMs);
    if (!rl.success) {
      return jsonErr(
        {
          message: "Too many requests.",
          retryAfterSec: rl.retryAfterSec,
          status: 429,
        },
        429,
      );
    }

    const body = BodySchema.parse(await req.json());
    const addr = validateWalletAddress(
      body.walletAddress,
      shop.token.chainId,
      shop.token.contract,
    );
    if (!addr.ok) {
      return jsonErr({ message: addr.reason, status: 400 }, 400);
    }

    const morapayCtx = { buyerIp: ip };
    await getQuote(
      {
        action: "OFFRAMP",
        inputAmount: body.tokenAmount,
        inputCurrency: shop.token.ticker,
        outputCurrency: body.currency,
        chain: String(shop.token.chainId),
      },
      morapayCtx,
    );

    const cookieStore = await cookies();
    const referral = resolveReferral({
      cookie: cookieStore.get(REFERRAL_COOKIE)?.value,
      env: process.env.MORAPAY_REFERRAL_CODE,
      config: shop.attribution.referralCode,
    });

    const initiated = await initiateOfframp(
      {
      currency: body.currency.toLowerCase(),
      token_amount: body.tokenAmount,
      wallet_address: addr.normalized,
      customer_name: body.customerName,
      client_channel: "browser",
      bank_code: body.bankCode,
      account_number: body.accountNumber,
      source_chain_id: String(shop.token.chainId),
      source_token_symbol: shop.token.ticker,
      source_token_address: shop.token.contract,
      referral_code: referral,
      turnstileToken: body.turnstileToken,
      },
      morapayCtx,
    );

    const ref = String(
      initiated.merchantReference ?? initiated.merchant_reference ?? "",
    );
    if (!ref) {
      return jsonErr({ message: "Sell order missing reference.", status: 502 }, 502);
    }

    const confirmed = await confirmOfframp(
      ref,
      { wallet_address: addr.normalized },
      morapayCtx,
    );

    const depositAddress = String(
      confirmed.depositAddress ??
        confirmed.deposit_address ??
        (confirmed.deposit as { address?: string } | undefined)?.address ??
        "",
    );

    // Safety: refuse if deposit address equals token contract
    if (
      depositAddress &&
      depositAddress.toLowerCase() === shop.token.contract.toLowerCase()
    ) {
      return jsonErr(
        {
          message:
            "Unsafe deposit address returned. Please contact support instead of sending tokens.",
          status: 502,
        },
        502,
      );
    }

    return jsonOk({
      ref,
      depositAddress,
      wallet: addr.normalized,
      raw: confirmed,
    });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
