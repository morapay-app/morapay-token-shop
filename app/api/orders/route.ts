import { z } from "zod";
import { cookies } from "next/headers";
import {
  getQuote,
  initiateOnramp,
  sendMobileMoney,
  confirmOnramp,
  listTransactions,
} from "@/lib/morapay/ramp";
import { MorapayApiError } from "@/lib/morapay/client";
import { getShopConfig, getHealth } from "@/lib/shop-runtime";
import { jsonOk, jsonErr } from "@/lib/api-response";
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
  fiatAmount: z.string().regex(/^\d+(\.\d+)?$/),
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
    const body = BodySchema.parse(raw);

    const addr = validateWalletAddress(
      body.walletAddress,
      shop.token.chainId,
      shop.token.contract,
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
      `order:${ip}:${walletStorageKey(addr.normalized, shop.token.chainId)}`,
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
        outputCurrency: shop.token.ticker,
        chain: String(shop.token.chainId),
        tokenAddress: shop.token.contract,
      },
      morapayCtx,
    );
    const coreTargetTokenAddress = merchantCoreTokenAddress(
      shop.token.chainId,
      shop.token.contract,
    );

    const amountNum = Number(body.fiatAmount);
    if (country.caps) {
      if (amountNum < country.caps.minFiat || amountNum > country.caps.maxFiat) {
        return jsonErr(
          {
            message: `Amount must be between ${country.caps.minFiat} and ${country.caps.maxFiat} ${body.currency.toUpperCase()}.`,
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
        shop.token.chainId,
      );
      const items = Array.isArray(existing)
        ? existing
        : ((existing as { items?: unknown[] })?.items ?? []);
      const fiveMinAgo = Date.now() - 5 * 60_000;
      for (const item of items as Record<string, unknown>[]) {
        const created = item.createdAt ? Date.parse(String(item.createdAt)) : 0;
        const fiat = String(item.fromAmount ?? item.fiatAmount ?? "");
        const cur = String(item.fiatCurrency ?? item.currency ?? "").toLowerCase();
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
      target_chain_id: String(shop.token.chainId),
      target_token_symbol: shop.token.ticker,
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
        nextStep: requiresOtp ? "otp" : "awaiting_prompt",
        requiresOtp,
        instructions,
        wallet: addr.normalized,
      });
    }

    // Bank transfer
    const confirmed = await confirmOnramp(
      ref,
      { wallet_address: addr.normalized },
      morapayCtx,
    );
    // Only the transfer details the payer needs; never the raw confirm response.
    const bankDeposit = parseBankDeposit(confirmed, body.currency);
    if (!bankDeposit) {
      return jsonErr({ message: "Bank details are unavailable. Don't send money.", status: 502 }, 502);
    }

    return jsonOk({
      ref,
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
