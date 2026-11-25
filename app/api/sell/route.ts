import { z } from "zod";
import { cookies } from "next/headers";
import {
  getBanks,
  getQuote,
  initiateOfframp,
  confirmOfframp,
  offrampDepositError,
  parseOfframpDepositInfo,
} from "@/lib/morapay/ramp";
import { getShopConfig, getHealth } from "@/lib/shop-runtime";
import { isNuban, needsAccountName, sellAmountError, shopCurrencies } from "@/lib/sell";
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

    if (!shopCurrencies(shop).includes(body.currency.toUpperCase())) {
      return jsonErr({ message: "Payout currency is not available.", status: 400 }, 400);
    }
    const amountError = sellAmountError(body.tokenAmount, shop);
    if (amountError) {
      return jsonErr({ message: amountError, status: 400 }, 400);
    }

    const morapayCtx = { buyerIp: ip };
    const banks = await getBanks(body.currency, morapayCtx);
    if (!banks.institutions.some((i) => i.code === body.bankCode)) {
      return jsonErr({ message: "Choose a payout network or bank.", status: 400 }, 400);
    }

    if (needsAccountName(body.currency) && !isNuban(body.accountNumber)) {
      return jsonErr(
        {
          code: "account.invalid",
          message: "Account number must be 10 digits",
          status: 400,
        },
        400,
      );
    }

    const quote = await getQuote(
      {
        action: "OFFRAMP",
        inputAmount: body.tokenAmount,
        inputCurrency: shop.token.ticker,
        outputCurrency: body.currency,
        chain: String(shop.token.chainId),
        tokenAddress: shop.token.contract,
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

    // Pi memos come back on the initiate response; the transaction read may not echo them.
    const deposit = parseOfframpDepositInfo(confirmed, initiated);
    const { depositAddress, depositDestinationTag } = deposit;

    const depositErr = offrampDepositError(shop.token.chainId, deposit);
    if (depositErr) {
      return jsonErr({ message: depositErr, status: 502 }, 502);
    }

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
      depositDestinationTag,
      depositMemo: deposit.depositMemo,
      depositAmount: deposit.depositAmount ?? body.tokenAmount,
      depositExpiresAt: deposit.depositExpiresAt,
      wallet: addr.normalized,
      payout: { amount: quote.output.amount, currency: quote.output.currency },
    });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
