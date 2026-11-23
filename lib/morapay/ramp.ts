import { z } from "zod";
import { walletAddressesEqual } from "@/lib/validate/address";
import { morapayFetch } from "./client";
import { merchantSigningEnabled } from "./merchant-config";

export const OnrampTargetSchema = z.object({
  chainId: z.number(),
  chainCode: z.string().optional(),
  symbol: z.string(),
  tokenAddress: z.string(),
  decimals: z.number(),
});

export const FiatCorridorSchema = z.object({
  currency: z.string(),
  country: z.string().optional(),
  buyLimits: z
    .object({
      minFiat: z.number(),
      maxFiat: z.number(),
    })
    .optional(),
  onrampPaymentMethods: z.array(z.string()).default([]),
  offrampPayoutMethods: z.array(z.string()).default([]),
});

export const RampConfigSchema = z.object({
  supportedCurrencies: z.array(z.string()).default([]),
  fiatCorridors: z.array(FiatCorridorSchema).default([]),
  supportedOnrampTargets: z.array(OnrampTargetSchema).default([]),
  supportedOfframpSources: z.array(OnrampTargetSchema).default([]),
  limits: z
    .object({
      sell: z
        .object({
          token: z.string().optional(),
          minToken: z.number().optional(),
          maxToken: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type RampConfig = z.infer<typeof RampConfigSchema>;
export type OnrampTarget = z.infer<typeof OnrampTargetSchema>;

export const QuoteSchema = z.object({
  quoteId: z.string(),
  expiresAt: z.string(),
  exchangeRate: z.string().optional(),
  basePrice: z.union([z.string(), z.number()]).optional(),
  input: z.object({
    amount: z.string(),
    currency: z.string(),
  }),
  output: z.object({
    amount: z.string(),
    currency: z.string(),
    chain: z.string().optional(),
  }),
  fees: z
    .object({
      networkFee: z.union([z.string(), z.number()]).optional(),
      platformFee: z.union([z.string(), z.number()]).optional(),
      totalFee: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  feeCapture: z.unknown().optional(),
});

export type Quote = z.infer<typeof QuoteSchema>;

export const InstitutionSchema = z.object({
  code: z.string(),
  name: z.string(),
  kind: z.enum(["bank", "mobile_money"]).or(z.string()),
});

export const BanksResponseSchema = z.object({
  currency: z.string().optional(),
  country: z.string().optional(),
  institutions: z.array(InstitutionSchema).default([]),
});

export const LimitsSchema = z.object({
  currency: z.string().optional(),
  buy: z
    .object({
      minFiat: z.number(),
      maxFiat: z.number(),
    })
    .optional(),
  sell: z
    .object({
      minToken: z.number(),
      maxToken: z.number(),
    })
    .optional(),
  corridor: z.unknown().optional(),
});

const MERCHANT_RAMP = "/api/v1/merchant/ramp";

export type MorapayCallContext = {
  buyerIp?: string;
};

function normalizeRampConfig(data: unknown): RampConfig {
  const raw = data as Record<string, unknown>;
  if (raw.supportedOnrampTargets) return RampConfigSchema.parse(data);
  return RampConfigSchema.parse({
    supportedCurrencies:
      (raw.supportedCurrencies as string[]) ??
      // Merchant v1 /ramp/config returns `currencies` (public ramp used `supportedCurrencies`).
      (raw.currencies as string[]) ??
      (Array.isArray(raw.corridors)
        ? (raw.corridors as { currency: string }[]).map((c) => c.currency)
        : undefined) ??
      [],
    fiatCorridors: raw.fiatCorridors ?? raw.corridors ?? [],
    supportedOnrampTargets: raw.supportedOnrampTargets ?? raw.onrampTargets ?? [],
    supportedOfframpSources: raw.supportedOfframpSources ?? [],
    limits: raw.limits,
  });
}

export type RampTransaction = Record<string, unknown> & {
  merchantReference?: unknown;
  merchant_reference?: unknown;
  status?: unknown;
  bankDeposit?: unknown;
  bank_deposit?: unknown;
  payment?: unknown;
  paymentInstructions?: unknown;
  depositAddress?: unknown;
  deposit_address?: unknown;
  deposit?: unknown;
  destinationWallet?: unknown;
};

function normalizeTransaction(tx: Record<string, unknown>): RampTransaction {
  const reference = tx.reference ?? tx.merchantReference ?? tx.merchant_reference;
  return {
    ...tx,
    merchantReference: reference,
    merchant_reference: reference,
    status: tx.status ?? tx.state,
    fromAmount: tx.fromAmount ?? tx.fiatAmount ?? tx.amount,
    fiatAmount: tx.fiatAmount ?? tx.amount,
    fiatCurrency: tx.fiatCurrency ?? tx.currency,
    wallet_address: tx.wallet_address ?? tx.destinationWallet,
  };
}

export async function getRampConfig(ctx: MorapayCallContext = {}): Promise<RampConfig> {
  const data = await morapayFetch<unknown>(`${MERCHANT_RAMP}/config`, {
    buyerIp: ctx.buyerIp,
  });
  const raw = (data ?? {}) as Record<string, unknown>;
  if (raw.supportedOnrampTargets || raw.onrampTargets) {
    return normalizeRampConfig(data);
  }
  // Merchant v1 /ramp/config has no token list: buy targets / sell sources come from
  // GET /ramp/tokens (same hub asset list the public ramp exposed as supportedOnrampTargets).
  const tokens = await morapayFetch<unknown>(`${MERCHANT_RAMP}/tokens`, {
    buyerIp: ctx.buyerIp,
  });
  const list = Array.isArray(tokens) ? tokens : [];
  return normalizeRampConfig({
    ...raw,
    supportedCurrencies: raw.supportedCurrencies ?? raw.currencies ?? [],
    supportedOnrampTargets: list,
    supportedOfframpSources: raw.supportedOfframpSources ?? list,
  });
}

export async function getLimits(
  currency: string,
  clientChannel = "browser",
  ctx: MorapayCallContext = {},
): Promise<z.infer<typeof LimitsSchema>> {
  const data = await morapayFetch<unknown>(`${MERCHANT_RAMP}/limits`, {
    searchParams: {
      currency: currency.toLowerCase(),
      client_channel: clientChannel,
    },
    buyerIp: ctx.buyerIp,
  });
  return LimitsSchema.parse(data);
}

export async function getBanks(currency: string, ctx: MorapayCallContext = {}) {
  const data = await morapayFetch<unknown>(`${MERCHANT_RAMP}/banks`, {
    searchParams: { currency: currency.toLowerCase() },
    buyerIp: ctx.buyerIp,
  });
  return BanksResponseSchema.parse(data);
}

/**
 * Token-shop quote: signed POST /api/v1/quotes/checkout (Morapay quotes API).
 * Fiat-only merchant ramp quote does not return per-token payout rows.
 */
export async function getQuote(
  input: {
    action: "ONRAMP" | "OFFRAMP";
    inputAmount: string;
    inputCurrency: string;
    outputCurrency: string;
    chain: string | number;
    /** Token contract (buy target / sell source) — disambiguates symbols across chains. */
    tokenAddress?: string;
  },
  ctx: MorapayCallContext = {},
): Promise<Quote> {
  if (input.action === "ONRAMP") {
    // Server-priced buy quote from the merchant ramp pricing engine (signed). The legacy
    // /api/v1/quotes/checkout route is not exposed on api.morapay.io.
    const body = {
      direction: "onramp",
      currency: input.inputCurrency.toLowerCase(),
      amount: String(input.inputAmount),
      targetChainId: Number(input.chain),
      targetTokenSymbol: input.outputCurrency.toUpperCase(),
      ...(input.tokenAddress ? { targetTokenAddress: input.tokenAddress } : {}),
    };
    const data = await morapayFetch<Record<string, unknown>>(
      `${MERCHANT_RAMP}/quote`,
      { method: "POST", body, buyerIp: ctx.buyerIp },
    );
    const target = (data.target ?? {}) as Record<string, unknown>;
    const estimated = target.estimatedAmount;
    if (estimated == null || String(estimated) === "") {
      throw new Error("No buy quote for this token and chain.");
    }
    return QuoteSchema.parse({
      quoteId: String(data.quoteId ?? data.id ?? `onramp_${Date.now()}`),
      expiresAt: String(
        data.expiresAt ?? new Date(Date.now() + 5 * 60_000).toISOString(),
      ),
      exchangeRate:
        typeof data.rateLabel === "string" ? data.rateLabel : undefined,
      input: {
        amount: String(data.customerAmount ?? data.amount ?? input.inputAmount),
        currency: input.inputCurrency.toUpperCase(),
      },
      output: {
        amount: String(estimated),
        currency: String(target.symbol ?? input.outputCurrency).toUpperCase(),
        chain: String(target.chainId ?? input.chain),
      },
      feeCapture: data.merchantFee ?? undefined,
    });
  }

  const body = {
    direction: "offramp",
    currency: input.outputCurrency.toLowerCase(),
    amount: String(input.inputAmount),
    // Merchant ramp quote: a sell's token is the *source* asset.
    sourceTokenSymbol: input.inputCurrency.toUpperCase(),
    sourceChainId: Number(input.chain),
    ...(input.tokenAddress ? { sourceTokenAddress: input.tokenAddress } : {}),
  };
  const data = await morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/quote`,
    { method: "POST", body, buyerIp: ctx.buyerIp },
  );
  return QuoteSchema.parse({
    quoteId: String(data.quoteId ?? data.id ?? "offramp_quote"),
    expiresAt: String(
      data.expiresAt ?? new Date(Date.now() + 5 * 60_000).toISOString(),
    ),
    input: {
      amount: String(input.inputAmount),
      currency: input.inputCurrency.toUpperCase(),
    },
    output: {
      amount: String(data.customerAmount ?? data.quotedAmount ?? data.amount ?? "0"),
      currency: input.outputCurrency.toUpperCase(),
      chain: String(input.chain),
    },
    feeCapture: data.merchantFee,
  });
}

export function buildQuoteBody(input: {
  action: "ONRAMP" | "OFFRAMP";
  inputAmount: string;
  inputCurrency: string;
  outputCurrency: string;
  chain: string | number;
}) {
  return {
    action: input.action,
    inputAmount: String(input.inputAmount),
    inputCurrency: input.inputCurrency.toUpperCase(),
    outputCurrency: input.outputCurrency.toUpperCase(),
    chain: String(input.chain),
  };
}

export type InitiateOnrampBody = {
  currency: string;
  fiat_amount: string;
  payout_wallet_address: string;
  wallet_address: string;
  customer_name?: string;
  customer_email?: string;
  client_channel: "browser";
  target_chain_id: string;
  target_token_symbol: string;
  target_token_address?: string;
  quoted_to_amount: string;
  phone_number?: string;
  network_provider?: string;
  referral_code?: string;
  turnstileToken?: string;
  payment_method?: "mobile_money" | "bank_transfer" | "bank" | "card";
  /** XRPL destination tag for exchange / tagged receive addresses */
  payout_destination_tag?: number;
};

export function buildInitiateOnrampPayload(
  body: InitiateOnrampBody,
): Record<string, unknown> {
  const paymentMethod =
    body.payment_method === "bank_transfer" || body.payment_method === "bank"
      ? "bank"
      : body.payment_method === "card"
        ? "card"
        : "mobile_money";

  const payload: Record<string, unknown> = {
    currency: body.currency.toLowerCase(),
    amount: body.fiat_amount,
    destinationWallet: body.payout_wallet_address,
    walletAddress: body.wallet_address,
    paymentMethod,
    phoneNumber: body.phone_number,
    networkProvider: body.network_provider,
    customerName: body.customer_name,
    customerEmail: body.customer_email,
    clientChannel: body.client_channel,
    targetChainId: body.target_chain_id,
    targetTokenSymbol: body.target_token_symbol,
    targetTokenAddress: body.target_token_address,
    quotedToAmount: body.quoted_to_amount,
    referralCode: body.referral_code,
    turnstileToken: body.turnstileToken,
    shopId: process.env.SHOP_ID,
  };

  if (body.payout_destination_tag != null) {
    payload.payoutDestinationTag = body.payout_destination_tag;
  }

  return payload;
}

export async function initiateOnramp(
  body: InitiateOnrampBody,
  ctx: MorapayCallContext = {},
) {
  const payload: Record<string, unknown> = {
    ...buildInitiateOnrampPayload(body),
    clientIp: ctx.buyerIp,
  };

  const data = await morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/onramp`,
    { method: "POST", body: payload, timeoutMs: 60_000, buyerIp: ctx.buyerIp },
  );

  const payment = data.payment as Record<string, unknown> | undefined;

  return {
    ...data,
    merchantReference: data.reference ?? data.merchantReference,
    momoPromptSent: data.momoPromptSent ?? payment?.momoPromptSent,
    requiresOtp: data.requiresOtp ?? payment?.requiresOtp,
    paymentInstructions: data.paymentInstructions ?? data.payment,
    order_secret: data.orderSecret ?? data.order_secret,
  } as Record<string, unknown>;
}

export async function sendMobileMoney(
  merchantReference: string,
  body: {
    wallet_address: string;
    phone_number: string;
    network_provider: string;
    order_secret?: string;
  },
  ctx: MorapayCallContext = {},
) {
  // Documented gap: no dedicated MoMo re-prompt route in merchant-ramp.md —
  // this path mirrors the public flow for merchants that enable it server-side.
  const data = await morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/transactions/${encodeURIComponent(merchantReference)}/mobile-money`,
    { method: "POST", body, timeoutMs: 60_000, buyerIp: ctx.buyerIp },
  );
  return {
    ...data,
    requiresOtp: data.requiresOtp,
    paymentInstructions: data.paymentInstructions ?? data.payment,
  };
}

export async function verifyOtp(
  body: {
    wallet_address: string;
    merchant_reference: string;
    otp: string;
  },
  ctx: MorapayCallContext = {},
) {
  return morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/transactions/${encodeURIComponent(body.merchant_reference)}/otp`,
    {
      method: "POST",
      body: { otp: body.otp, walletAddress: body.wallet_address },
      timeoutMs: 60_000,
      buyerIp: ctx.buyerIp,
    },
  );
}

export async function confirmOnramp(
  merchantReference: string,
  body: { wallet_address: string },
  ctx: MorapayCallContext = {},
) {
  const tx = await getTransaction(merchantReference, body.wallet_address, ctx);
  return {
    ...tx,
    bankDeposit: tx.bankDeposit ?? tx.bank_deposit ?? tx.payment,
  };
}

export async function getTransaction(
  merchantReference: string,
  walletAddress: string,
  ctx: MorapayCallContext = {},
) {
  const data = await morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/transactions/${encodeURIComponent(merchantReference)}`,
    {
      searchParams: walletAddress ? { wallet_address: walletAddress } : undefined,
      buyerIp: ctx.buyerIp,
    },
  );
  return normalizeTransaction(data);
}

export async function listTransactions(
  walletAddress: string,
  limit = 10,
  ctx: MorapayCallContext = {},
  chainId?: number,
) {
  const data = await morapayFetch<unknown>(`${MERCHANT_RAMP}/transactions`, {
    searchParams: { limit: String(limit), wallet_address: walletAddress },
    buyerIp: ctx.buyerIp,
  });
  // Always filter by wallet: the merchant list is business-wide, so never return other buyers' orders.
  const envelope = data as { items?: unknown[]; data?: unknown[] };
  const items = Array.isArray(data) ? data : (envelope.items ?? envelope.data ?? []);
  return (items as Record<string, unknown>[])
    .map(normalizeTransaction)
    .filter((tx) => {
      if (!walletAddress) return true;
      const txWallet = String(tx.wallet_address ?? tx.destinationWallet ?? "");
      return chainId != null
        ? walletAddressesEqual(txWallet, walletAddress, chainId)
        : txWallet.toLowerCase() === walletAddress.toLowerCase();
    });
}

export async function initiateOfframp(
  body: Record<string, unknown>,
  ctx: MorapayCallContext = {},
) {
  const payload = {
    currency: String(body.currency ?? "").toLowerCase(),
    amount: String(body.token_amount ?? body.amount ?? ""),
    destinationWallet: body.wallet_address,
    bankCode: body.bank_code ?? body.bankCode,
    accountNumber: body.account_number ?? body.accountNumber,
    customerName: body.customer_name,
    targetChainId: body.source_chain_id,
    targetTokenSymbol: body.source_token_symbol,
    targetTokenAddress: body.source_token_address,
    referralCode: body.referral_code,
    turnstileToken: body.turnstileToken,
    clientChannel: body.client_channel,
    clientIp: ctx.buyerIp,
  };

  const data = await morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/offramp`,
    { method: "POST", body: payload, timeoutMs: 60_000, buyerIp: ctx.buyerIp },
  );
  const deposit = data.deposit as Record<string, unknown> | undefined;
  const depositDestinationTag =
    deposit?.destinationTag ??
    deposit?.destination_tag ??
    data.depositDestinationTag ??
    data.deposit_destination_tag;
  return {
    ...data,
    merchantReference: data.reference ?? data.merchantReference,
    depositAddress: deposit?.address ?? data.depositAddress,
    depositDestinationTag,
  } as Record<string, unknown>;
}

export async function confirmOfframp(
  ref: string,
  body: { wallet_address: string },
  ctx: MorapayCallContext = {},
) {
  const tx = await getTransaction(ref, body.wallet_address, ctx);
  const deposit = tx.deposit as Record<string, unknown> | undefined;
  const depositDestinationTag =
    tx.depositDestinationTag ??
    tx.deposit_destination_tag ??
    deposit?.destinationTag ??
    deposit?.destination_tag;
  return {
    ...tx,
    depositAddress:
      tx.depositAddress ?? tx.deposit_address ?? deposit?.address,
    deposit_address:
      tx.deposit_address ?? tx.depositAddress,
    depositDestinationTag,
    deposit_destination_tag: depositDestinationTag,
  };
}

export async function hubForward(
  ref: string,
  body: { wallet_address: string; deposit_tx_hash: string },
  ctx: MorapayCallContext = {},
) {
  return morapayFetch<Record<string, unknown>>(
    `${MERCHANT_RAMP}/transactions/${encodeURIComponent(ref)}/hub-forward`,
    { method: "POST", body, timeoutMs: 60_000, buyerIp: ctx.buyerIp },
  );
}

export function isTokenSupported(
  config: RampConfig,
  chainId: number,
  tokenAddress: string,
): boolean {
  const needle = tokenAddress.toLowerCase();
  return config.supportedOnrampTargets.some(
    (t) =>
      t.chainId === chainId &&
      t.tokenAddress.toLowerCase() === needle,
  );
}

export function parseOfframpDepositInfo(confirmed: Record<string, unknown>): {
  depositAddress: string;
  depositDestinationTag: number | string | undefined;
} {
  const deposit = confirmed.deposit as Record<string, unknown> | undefined;
  const depositAddress = String(
    confirmed.depositAddress ??
      confirmed.deposit_address ??
      deposit?.address ??
      "",
  );
  const rawTag =
    confirmed.depositDestinationTag ??
    confirmed.deposit_destination_tag ??
    deposit?.destinationTag ??
    deposit?.destination_tag;
  const depositDestinationTag =
    rawTag == null || rawTag === ""
      ? undefined
      : typeof rawTag === "number" || typeof rawTag === "string"
        ? rawTag
        : undefined;
  return { depositAddress, depositDestinationTag };
}

export { merchantSigningEnabled };