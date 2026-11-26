import { z } from "zod";
import { orderCancelTokenOrNull } from "@/lib/order-cancel";
import { cookies } from "next/headers";
import {
  getQuote,
  initiateOnramp,
  sendMobileMoney,
  confirmOnramp,
  listTransactions,
} from "@/lib/morapay/ramp";
import { MorapayApiError } from "@/lib/morapay/client";
import { getShopConfig, getHealth, resolveRequestToken } from "@/lib/shop-runtime";
import { narrowCaps } from "@/lib/quote-amount-bounds";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { bodyIssue, zPositiveAmount } from "@/lib/validate/amount";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";
import {
  validateWalletAddress,
  walletStorageKey,
} from "@/lib/validate/address";
import { resolvePayoutDestinationTag } from "@/lib/validate/destination-tag";
import { merchantCoreTokenAddress } from "@/lib/morapay/core-token";
import { parseBankDeposit } from "@/lib/morapay/bank-deposit";
import { parsePhoneForCountry, maskPhone } from "@/lib/validate/phone";
import { REFERRAL_COOKIE, resolveReferral } from "@/lib/referral";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  fiatAmount: zPositiveAmount,
  currency: z.string().min(3).max(4),
  country: z.string().length(2),
  methodId: z.string(),
  methodKind: z.enum(["mobile_money", "bank_transfer", "card"]),
  walletAddress: z.string().min(1),
  phoneNumber: z.string().optional(),
  networkProvider: z.string().optional(),
  customerName: z.string().optional(),
  // Ignored — server overrides from config
  target_token_address: z.string().optional(),
  target_chain_id: z.union([z.string(), z.number()]).optional(),
  turnstileToken: z.string().optional(),
  payoutDestinationTag: z.string().optional(),
  /** Ticker of one of this shop's tokens; omitted = the primary token. */
  token: z.string().max(16).optional(),
});

function isOpenStatus(status: unknown): boolean {
  const s = String(status ?? "").toUpperCase();
  return ["PENDING", "INITIATED", "AWAITING_PAYMENT", "PROCESSING", "CREATED"].includes(s);
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const shop = getShopConfig();
    const health = await getHealth();
    if (health.fallback) {
      return jsonErr(
        {
          code: "fallback",
          message: "Instant checkout is temporarily unavailable.",
          status: 503,
        },
        503,
      );
    }

    const raw = await req.json();
    const parsedBody = BodySchema.safeParse(raw);
    if (!parsedBody.success) {
      return jsonErr({ ...bodyIssue(parsedBody.error), status: 400 }, 400);
    }
    const body = parsedBody.data;

    // Chain, contract and caps come from this shop's config for the chosen ticker only.
    const resolved = await resolveRequestToken(body.token, "buy");
    if (!resolved.ok) {
      return jsonErr({ code: resolved.code, message: resolved.message, status: resolved.status }, resolved.status);
    }
    const token = resolved.token;

    const addr = validateWalletAddress(
      body.walletAddress,
      token.chainId,
      token.contract,
    );
    if (!addr.ok) {
      return jsonErr({ message: addr.reason, status: 400 }, 400);
    }

    const tag = resolvePayoutDestinationTag(
      body.payoutDestinationTag,
      addr.ok ? addr.embeddedDestinationTag : undefined,
    );
    if (!tag.ok) {
      return jsonErr({ message: tag.reason, status: 400 }, 400);
    }

    const walletRl = await rateLimit(
      `order:${ip}:${walletStorageKey(addr.normalized, token.chainId)}`,
      RL.order.limit,
      RL.order.windowMs,
    );
    if (!walletRl.success) {
      return jsonErr(
        {
          message: "Too many orders. Please wait before trying again.",
          retryAfterSec: walletRl.retryAfterSec,
          status: 429,
        },
        429,
      );
    }

    const country = shop.countries.list.find((c) => c.code === body.country);
    if (!country?.enabled) {
      return jsonErr({ message: "Country not available.", status: 400 }, 400);
    }
    const method = country.methods.find((m) => m.id === body.methodId);
    if (!method?.enabled) {
      return jsonErr({ message: "Payment method not available.", status: 400 }, 400);
    }

    // Fresh quote — ignore client token overrides
    const morapayCtx = { buyerIp: ip };
    const quote = await getQuote(
      {
        action: "ONRAMP",
        inputAmount: body.fiatAmount,
        inputCurrency: body.currency,
        outputCurrency: token.ticker,
        chain: String(token.chainId),
        tokenAddress: token.contract,
      },
      morapayCtx,
    );
    const coreTargetTokenAddress = merchantCoreTokenAddress(
      token.chainId,
      token.contract,
    );

    const amountNum = Number(body.fiatAmount);
    const caps = narrowCaps(country.caps, token.buyCaps[body.currency.toUpperCase()]);
    if (caps) {
      if (amountNum < caps.minFiat || amountNum > caps.maxFiat) {
        return jsonErr(
          {
            message: `Amount must be between ${caps.minFiat} and ${caps.maxFiat} ${body.currency.toUpperCase()}.`,
            status: 400,
          },
          400,
        );
      }
    }

    let phoneLocal: string | undefined;
    if (body.methodKind === "mobile_money") {
      if (!body.phoneNumber) {
        return jsonErr({ message: "Phone number is required.", status: 400 }, 400);
      }
      const phone = parsePhoneForCountry(body.phoneNumber, body.country);
      if (!phone.ok) {
        return jsonErr({ message: phone.reason, status: 400 }, 400);
      }
      phoneLocal = phone.local;
      console.info(
        JSON.stringify({
          type: "order_phone",
          masked: maskPhone(phone.local),
          shopId: shop.shopId,
        }),
      );
    }

    const cookieStore = await cookies();
    const referral = resolveReferral({
      cookie: cookieStore.get(REFERRAL_COOKIE)?.value,
      env: process.env.MORAPAY_REFERRAL_CODE,
      config: shop.attribution.referralCode,
    });

    // Idempotency: reuse open onramp from last 5 min with same amount/currency
    try {
      const existing = await listTransactions(
        addr.normalized,
        10,
        morapayCtx,
        token.chainId,
      );
      const items = Array.isArray(existing)
        ? existing
        : ((existing as { items?: unknown[] })?.items ?? []);
      const fiveMinAgo = Date.now() - 5 * 60_000;
      for (const item of items as Record<string, unknown>[]) {
        const created = item.createdAt ? Date.parse(String(item.createdAt)) : 0;
        const fiat = String(item.fromAmount ?? item.fiatAmount ?? "");
        const cur = String(item.fiatCurrency ?? item.currency ?? "").toLowerCase();
        // Same amount for another token is a different order.
        const delivery = (item.delivery ?? {}) as Record<string, unknown>;
        const itemToken = String(delivery.tokenSymbol ?? item.targetTokenSymbol ?? "").toUpperCase();
        if (itemToken && itemToken !== token.ticker.toUpperCase()) continue;
        if (
          isOpenStatus(item.status) &&
          created >= fiveMinAgo &&
          fiat === body.fiatAmount &&
          cur === body.currency.toLowerCase()
        ) {
          const ref = String(item.merchantReference ?? item.reference ?? "");
          if (ref) {
            return jsonOk({
              ref,
              nextStep: body.methodKind === "bank_transfer" ? "bank_deposit" : "awaiting_prompt",
              reused: true,
            });
          }
        }
      }
    } catch {
      // continue — list may fail
    }

    const initiateBody = {
      currency: body.currency.toLowerCase(),
      fiat_amount: body.fiatAmount,
      payout_wallet_address: addr.normalized,
      wallet_address: addr.normalized,
      customer_name: body.customerName,
      client_channel: "browser" as const,
      target_chain_id: String(token.chainId),
      target_token_symbol: token.ticker,
      ...(coreTargetTokenAddress
        ? { target_token_address: coreTargetTokenAddress }
        : {}),
      quoted_to_amount: quote.output.amount,
      phone_number: phoneLocal,
      network_provider: body.networkProvider ?? method.networkProvider,
      referral_code: referral,
      turnstileToken: body.turnstileToken,
      payment_method: body.methodKind,
      ...(tag.value != null ? { payout_destination_tag: tag.value } : {}),
    };

    const initiated = await initiateOnramp(initiateBody, morapayCtx);
    const ref = String(
      initiated.merchantReference ?? initiated.merchant_reference ?? "",
    );
    if (!ref) {
      return jsonErr({ message: "Order created without a reference.", status: 502 }, 502);
    }

    const orderSecret =
      typeof initiated.order_secret === "string"
        ? initiated.order_secret
        : undefined;

    if (body.methodKind === "mobile_money") {
      const momoPromptSent = initiated.momoPromptSent === true;
      let requiresOtp = initiated.requiresOtp === true;
      let instructions = initiated.paymentInstructions;

      if (!momoPromptSent && phoneLocal) {
        try {
          const mm = await sendMobileMoney(
            ref,
            {
              wallet_address: addr.normalized,
              phone_number: phoneLocal,
              network_provider:
                body.networkProvider ?? method.networkProvider ?? "MTN",
              order_secret: orderSecret,
            },
            morapayCtx,
          );
          requiresOtp = mm.requiresOtp === true || requiresOtp;
          instructions = mm.paymentInstructions ?? instructions;
        } catch (err) {
          if (
            err instanceof MorapayApiError &&
            err.code === "momo_already_started"
          ) {
            // OK — continue
          } else {
            throw err;
          }
        }
      }

      return jsonOk({
        ref,
        cancelToken: orderCancelTokenOrNull(ref),
        nextStep: requiresOtp ? "otp" : "awaiting_prompt",
        requiresOtp,
        instructions,
        wallet: addr.normalized,
      });
    }

    // Bank transfer
    // Only the transfer details the payer needs; never the raw confirm response. The virtual account
    // can take a moment to appear after the order opens, so read it a few times before giving up.
    let bankDeposit = null;
    for (let attempt = 0; attempt < 4 && !bankDeposit; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500));
      const confirmed = await confirmOnramp(ref, { wallet_address: addr.normalized }, morapayCtx);
      bankDeposit = parseBankDeposit(confirmed, body.currency);
    }
    if (!bankDeposit) {
      return jsonErr({ message: "Bank details are unavailable. Don't send money.", status: 502 }, 502);
    }

    return jsonOk({
      ref,
      cancelToken: orderCancelTokenOrNull(ref),
      nextStep: "bank_deposit",
      bankDeposit,
      wallet: addr.normalized,
    });
  } catch (err) {
    if (err instanceof MorapayApiError) {
      if (err.code === "name_mismatch" || err.code === "account_lookup_failed") {
        return jsonErr(
          {
            code: err.code,
            message: "The name on this account doesn't match.",
            requestId: err.requestId,
            status: 400,
          },
          400,
        );
      }
    }
    return jsonErr(err, 502);
  }
}
