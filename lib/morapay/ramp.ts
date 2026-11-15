import { z } from "zod";
import { morapayFetch } from "./client";

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

export async function getRampConfig(): Promise<RampConfig> {
  const data = await morapayFetch<unknown>("/api/public/ramp/config");
  return RampConfigSchema.parse(data);
}

export async function getLimits(
  currency: string,
  clientChannel = "browser",
): Promise<z.infer<typeof LimitsSchema>> {
  const data = await morapayFetch<unknown>("/api/public/ramp/limits", {
    searchParams: { currency: currency.toLowerCase(), client_channel: clientChannel },
  });
  return LimitsSchema.parse(data);
}

export async function getBanks(currency: string) {
  const cur = currency.toLowerCase();
  const path =
    cur === "ngn"
      ? "/api/public/fiat/banks"
      : "/api/public/ramp/banks";
  const data = await morapayFetch<unknown>(path, {
    searchParams: { currency: cur },
  });
  return BanksResponseSchema.parse(data);
}

/**
 * Quote adapter — chain MUST be a string (verified live).
 */
export async function getQuote(input: {
  action: "ONRAMP" | "OFFRAMP";
  inputAmount: string;
  inputCurrency: string;
  outputCurrency: string;
  chain: string | number;
}): Promise<Quote> {
  const body = {
    action: input.action,
    inputAmount: String(input.inputAmount),
    inputCurrency: input.inputCurrency.toUpperCase(),
    outputCurrency: input.outputCurrency.toUpperCase(),
    chain: String(input.chain),
  };
  const data = await morapayFetch<unknown>("/api/public/quotes", {
    method: "POST",
    body,
  });
  return QuoteSchema.parse(data);
}

/** Build quote body for tests — ensures chain is string. */
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
  client_channel: "browser";
  target_chain_id: string;
  target_token_symbol: string;
  target_token_address?: string;
  quoted_to_amount: string;
  phone_number?: string;
  network_provider?: string;
  referral_code?: string;
  turnstileToken?: string;
};

export async function initiateOnramp(body: InitiateOnrampBody) {
  return morapayFetch<Record<string, unknown>>(
    "/api/public/ramp/onramp/initiate",
    { method: "POST", body, timeoutMs: 60_000 },
  );
}

export async function sendMobileMoney(
  merchantReference: string,
  body: {
    wallet_address: string;
    phone_number: string;
    network_provider: string;
    order_secret?: string;
  },
) {
  return morapayFetch<Record<string, unknown>>(
    `/api/public/ramp/onramp/${encodeURIComponent(merchantReference)}/mobile-money`,
    { method: "POST", body, timeoutMs: 60_000 },
  );
}

export async function verifyOtp(body: {
  wallet_address: string;
  merchant_reference: string;
  otp: string;
}) {
  return morapayFetch<Record<string, unknown>>(
    "/api/public/ramp/onramp/mobile-money/verify-otp",
    { method: "POST", body, timeoutMs: 60_000 },
  );
}

export async function confirmOnramp(
  merchantReference: string,
  body: { wallet_address: string },
) {
  return morapayFetch<Record<string, unknown>>(
    `/api/public/ramp/onramp/${encodeURIComponent(merchantReference)}/confirm`,
    { method: "POST", body, timeoutMs: 60_000 },
  );
}

export async function getTransaction(
  merchantReference: string,
  walletAddress: string,
) {
  return morapayFetch<Record<string, unknown>>(
    `/api/public/ramp/transactions/${encodeURIComponent(merchantReference)}`,
    { searchParams: { wallet_address: walletAddress } },
  );
}

export async function listTransactions(walletAddress: string, limit = 10) {
  return morapayFetch<unknown>("/api/public/ramp/transactions", {
    searchParams: { wallet_address: walletAddress, limit: String(limit) },
  });
}

export async function initiateOfframp(body: Record<string, unknown>) {
  return morapayFetch<Record<string, unknown>>(
    "/api/public/ramp/offramp/initiate",
    { method: "POST", body, timeoutMs: 60_000 },
  );
}

export async function confirmOfframp(
  ref: string,
  body: { wallet_address: string },
) {
  return morapayFetch<Record<string, unknown>>(
    `/api/public/ramp/offramp/${encodeURIComponent(ref)}/confirm`,
    { method: "POST", body, timeoutMs: 60_000 },
  );
}

export async function hubForward(
  ref: string,
  body: { wallet_address: string; deposit_tx_hash: string },
) {
  // UNVERIFIED — behind adapter + tests
  return morapayFetch<Record<string, unknown>>(
    `/api/public/ramp/offramp/${encodeURIComponent(ref)}/hub-forward`,
    { method: "POST", body, timeoutMs: 60_000 },
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
      t.chainId === chainId && t.tokenAddress.toLowerCase() === needle,
  );
}
