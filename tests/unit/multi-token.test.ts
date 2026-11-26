/**
 * Multi-token shops (Pi shop: PI default, PCM on Optimism second). Routes take chain/contract from
 * config for the chosen ticker only, refuse tickers the shop does not offer, and hide a token core
 * is not listing for that direction. Single-token shops keep their behaviour.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.SHOP_ID = "pi";

const PCM = "0xD0CF4dE352aC8dccE00bD6B93EE73D3Cb272edC3";
const EVM_WALLET = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
const PI_WALLET = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
const SELL_DEPOSIT = "0x42c007a3d8cdbcc2ae601594557193c32207d8b0";

const core = vi.hoisted(() => ({
  pcm: { buyEnabled: true, sellEnabled: true } as { buyEnabled?: boolean; sellEnabled?: boolean } | null,
  /** Core lists PI as a buy target (false matches production while Pi is not live). */
  listPi: true,
  getQuote: vi.fn(),
  initiateOnramp: vi.fn(),
  initiateOfframp: vi.fn(),
  confirmOfframp: vi.fn(),
}));

/**
 * The multi-token mechanics are tested with PI open and selling on ("open"); the Pi shop as shipped
 * (PI coming soon, sell tab off until the PCM approve policy is live) is tested on its own below.
 */
const piVariant = vi.hoisted(() => ({ open: true }));
vi.mock("@/examples/pi.config", async (importOriginal) => {
  type Cfg = { token: Record<string, unknown>; sell: Record<string, unknown> } & Record<string, unknown>;
  const real = ((await importOriginal()) as { default: Cfg }).default;
  const open = { ...real, token: { ...real.token, comingSoon: false }, sell: { ...real.sell, enabled: true } };
  // A getter: Vitest caches this factory's result, so the variant is read whenever a module loads it.
  return {
    get default() {
      return piVariant.open ? open : real;
    },
  };
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/morapay/merchant-config", () => ({
  merchantSigningEnabled: () => true,
  getMerchantConfigStatus: () => ({ ready: true }),
}));
vi.mock("@/lib/morapay/ramp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/morapay/ramp")>();
  return {
    ...actual,
    getRampConfig: async () => ({
      supportedCurrencies: ["GHS", "NGN"],
      fiatCorridors: [],
      supportedOnrampTargets: [
        ...(core.listPi ? [{ chainId: 31415926, symbol: "PI", tokenAddress: "pi", decimals: 7 }] : []),
        ...(core.pcm ? [{ chainId: 10, symbol: "PCM", tokenAddress: PCM, decimals: 18, ...core.pcm }] : []),
      ],
      supportedOfframpSources: [],
    }),
    getQuote: core.getQuote,
    initiateOnramp: core.initiateOnramp,
    initiateOfframp: core.initiateOfframp,
    confirmOfframp: core.confirmOfframp,
    listTransactions: async () => [],
    sendMobileMoney: vi.fn(),
    confirmOnramp: vi.fn(),
    getBanks: async () => ({ institutions: [{ code: "MTN", name: "MTN", kind: "mobile_money" }] }),
  };
});

const quoteOut = (amount: string, currency: string) => ({
  quoteId: "q1",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  input: { amount: "100", currency: "GHS" },
  output: { amount, currency },
});

beforeEach(async () => {
  const { __resetRateLimitMemory } = await import("@/lib/ratelimit");
  __resetRateLimitMemory();
  delete process.env.UPSTASH_REDIS_REST_URL;
  core.pcm = { buyEnabled: true, sellEnabled: true };
  core.getQuote.mockReset().mockResolvedValue(quoteOut("2300", "PCM"));
  core.initiateOnramp.mockReset().mockResolvedValue({ merchantReference: "morapay_pcm1", momoPromptSent: true });
  core.initiateOfframp.mockReset().mockResolvedValue({ merchantReference: "morapay_pcm2" });
  core.confirmOfframp.mockReset().mockResolvedValue({ deposit: { address: SELL_DEPOSIT, amount: "1000" } });
});
afterEach(() => vi.resetModules());

async function call(path: string, body: unknown) {
  const mod = await import(`@/app/api/${path}/route`);
  const res: Response = await mod.POST(
    new Request(`https://pi.morapay.shop/api/${path}`, {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.7", "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, json: await res.json() };
}

describe("config and helpers", () => {
  it("the Pi shop parses with PCM second, and every other shop has no extra tokens", async () => {
    const { ShopConfigSchema, lintShopConfig } = await import("@/config/schema");
    const { shopTokens, findShopToken } = await import("@/lib/shop-tokens");
    const pi = ShopConfigSchema.parse((await import("@/examples/pi.config")).default);
    expect(lintShopConfig((await import("@/examples/pi.config")).default)).toEqual([]);
    expect(shopTokens(pi).map((t) => [t.ticker, t.chainId, t.primary])).toEqual([
      ["PI", 31415926, true],
      ["PCM", 10, false],
    ]);
    expect(findShopToken(pi, null)?.ticker).toBe("PI");
    expect(findShopToken(pi, "pcm")).toMatchObject({ contract: PCM, chainName: "Optimism", buyCaps: { GHS: { maxFiat: 1500 } } });
    expect(findShopToken(pi, "MILAN")).toBeNull();
    for (const name of ["amem", "griot", "ipod", "milan", "wikicat", "xrp"]) {
      const shop = ShopConfigSchema.parse((await import(`@/examples/${name}.config.ts`)).default);
      expect(shop.extraTokens).toEqual([]);
      expect(shopTokens(shop)).toHaveLength(1);
    }
  });

  it("rejects an extra token whose contract does not fit its chain, a duplicate ticker, or an unknown chain", async () => {
    const { ShopConfigSchema } = await import("@/config/schema");
    const pi = structuredClone((await import("@/examples/pi.config")).default);
    const extra = pi.extraTokens[0]!;
    const bad = (patch: Partial<typeof extra>) =>
      ShopConfigSchema.safeParse({ ...pi, extraTokens: [{ ...extra, ...patch }] }).success;
    expect(bad({})).toBe(true);
    expect(bad({ contract: "pi" })).toBe(false);
    expect(bad({ ticker: "pi" })).toBe(false);
    expect(bad({ chainId: 999_999 })).toBe(false);
    expect(bad({ chainId: 31415926 })).toBe(false);
  });

  it("buy caps narrow the country range; sell range is per token", async () => {
    const { onrampAmountBoundsError } = await import("@/lib/quote-amount-bounds");
    const { sellAmountError } = await import("@/lib/sell");
    const { ShopConfigSchema } = await import("@/config/schema");
    const { findShopToken } = await import("@/lib/shop-tokens");
    const pi = ShopConfigSchema.parse((await import("@/examples/pi.config")).default);
    const pcm = findShopToken(pi, "PCM")!;
    expect(onrampAmountBoundsError("2000", "GHS", pi, pcm)).toMatchObject({ code: "amount.above_max" });
    expect(onrampAmountBoundsError("2000", "GHS", pi)).toBeNull();
    expect(sellAmountError("6000", pi, pcm)).toBe("Maximum sell amount is 5000 PCM");
    expect(sellAmountError("6000", pi)).toBeNull();
  });

  it("receipts link the order's own chain", async () => {
    const { ShopConfigSchema } = await import("@/config/schema");
    const { shopTokenForOrder } = await import("@/lib/shop-tokens");
    const pi = ShopConfigSchema.parse((await import("@/examples/pi.config")).default);
    expect(shopTokenForOrder(pi, { chainId: 10, tokenAddress: PCM.toLowerCase() }).ticker).toBe("PCM");
    expect(shopTokenForOrder(pi, { tokenSymbol: "pcm" }).ticker).toBe("PCM");
    expect(shopTokenForOrder(pi, { chainId: 31415926, tokenSymbol: "PI" }).ticker).toBe("PI");
    expect(shopTokenForOrder(pi, {}).ticker).toBe("PI");
  });
});

describe("routes", { timeout: 30_000 }, () => {
  it("/api/config lists PI then PCM, and drops PCM while core does not list it", async () => {
    const { GET } = await import("@/app/api/config/route");
    const res = await GET(new Request("https://pi.morapay.shop/api/config"));
    const json = await res.json();
    expect(json.data.token.ticker).toBe("PI");
    expect(json.data.tokens.map((t: { ticker: string; buy: boolean; sell: boolean }) => [t.ticker, t.buy, t.sell])).toEqual([
      ["PI", true, true],
      ["PCM", true, true],
    ]);
    vi.resetModules();
    core.pcm = null;
    const { GET: GET2 } = await import("@/app/api/config/route");
    const json2 = await (await GET2(new Request("https://pi.morapay.shop/api/config"))).json();
    expect(json2.data.tokens.map((t: { ticker: string }) => t.ticker)).toEqual(["PI"]);
  });

  it("quotes PCM from config (chain 10, its contract), PI by default", async () => {
    expect((await call("quote", { action: "ONRAMP", inputAmount: "500", inputCurrency: "GHS", token: "PCM" })).status).toBe(200);
    expect(core.getQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({ outputCurrency: "PCM", chain: "10", tokenAddress: PCM }),
      expect.anything(),
    );
    await call("quote", { action: "ONRAMP", inputAmount: "500", inputCurrency: "GHS" });
    expect(core.getQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({ outputCurrency: "PI", chain: "31415926", tokenAddress: "pi" }),
      expect.anything(),
    );
  });

  it("refuses an unknown ticker, a PCM buy over its cap, and a paused direction", async () => {
    expect((await call("quote", { action: "ONRAMP", inputAmount: "500", inputCurrency: "GHS", token: "MILAN" })).status).toBe(400);
    const over = await call("quote", { action: "ONRAMP", inputAmount: "2000", inputCurrency: "GHS", token: "PCM" });
    expect(over).toMatchObject({ status: 400, json: { code: "amount.above_max" } });
    vi.resetModules();
    core.pcm = { buyEnabled: true, sellEnabled: false };
    const paused = await call("quote", { action: "OFFRAMP", inputAmount: "1000", inputCurrency: "GHS", token: "PCM" });
    expect(paused).toMatchObject({ status: 503, json: { code: "token.paused", message: "PCM sells are paused." } });
    expect((await call("quote", { action: "ONRAMP", inputAmount: "500", inputCurrency: "GHS", token: "MILAN" })).json).toMatchObject({
      code: "token.unknown",
      message: "Token not available.",
    });
    expect(core.getQuote).not.toHaveBeenCalled();
  });

  it("a PCM buy sends chain 10 and the configured contract, never the client's, to a 0x wallet", async () => {
    const order = {
      fiatAmount: "500",
      currency: "GHS",
      country: "GH",
      methodId: "momo_mtn",
      methodKind: "mobile_money",
      phoneNumber: "0244123456",
      walletAddress: EVM_WALLET,
      token: "PCM",
      target_token_address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      target_chain_id: 56,
    };
    const res = await call("orders", order);
    expect(res.status).toBe(200);
    expect(core.initiateOnramp).toHaveBeenCalledWith(
      expect.objectContaining({
        target_chain_id: "10",
        target_token_symbol: "PCM",
        target_token_address: PCM,
        payout_wallet_address: EVM_WALLET,
      }),
      expect.anything(),
    );
    // A Pi wallet is not an Optimism address.
    expect((await call("orders", { ...order, walletAddress: PI_WALLET })).status).toBe(400);
    expect((await call("orders", { ...order, token: undefined, walletAddress: EVM_WALLET })).status).toBe(400);
  });

  it("a PCM sell opens on chain 10 with the configured contract and returns a 0x deposit", async () => {
    const res = await call("sell", {
      tokenAmount: "1000",
      currency: "GHS",
      walletAddress: EVM_WALLET,
      bankCode: "MTN",
      accountNumber: "0244123456",
      token: "PCM",
    });
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ token: "PCM", depositAddress: SELL_DEPOSIT, depositAmount: "1000" });
    expect(core.initiateOfframp).toHaveBeenCalledWith(
      expect.objectContaining({ source_chain_id: "10", source_token_symbol: "PCM", source_token_address: PCM }),
      expect.anything(),
    );
    const tooMuch = await call("sell", {
      tokenAmount: "6000",
      currency: "GHS",
      walletAddress: EVM_WALLET,
      bankCode: "MTN",
      accountNumber: "0244123456",
      token: "PCM",
    });
    // Same refusal shape as the single-token sell route (the widget shows the range itself).
    expect(tooMuch.status).toBe(400);
    expect(core.initiateOfframp).toHaveBeenCalledTimes(1);
  });
});

describe("smart-wallet confirmation", { timeout: 30_000 }, () => {
  const order = {
    fiatAmount: "500",
    currency: "GHS",
    country: "GH",
    methodId: "momo_mtn",
    methodKind: "mobile_money",
    phoneNumber: "0244123456",
    walletAddress: EVM_WALLET,
    token: "PCM",
  };

  it("passes the customer's confirmation to core only when given", async () => {
    await call("orders", order);
    expect(core.initiateOnramp.mock.lastCall![0]).not.toHaveProperty("allow_contract_recipient");
    await call("orders", { ...order, confirmSmartWallet: true });
    expect(core.initiateOnramp.mock.lastCall![0]).toMatchObject({ allow_contract_recipient: true });
  });

  it("sends allowContractRecipient in core's payload only when confirmed", async () => {
    const { buildInitiateOnrampPayload } = await import("@/lib/morapay/ramp");
    const base = {
      currency: "GHS",
      fiat_amount: "500",
      payout_wallet_address: EVM_WALLET,
      wallet_address: EVM_WALLET,
      client_channel: "browser" as const,
      target_chain_id: "10",
      target_token_symbol: "PCM",
      quoted_to_amount: "1",
    };
    expect(buildInitiateOnrampPayload(base)).not.toHaveProperty("allowContractRecipient");
    expect(buildInitiateOnrampPayload({ ...base, allow_contract_recipient: true })).toMatchObject({ allowContractRecipient: true });
  });
});

describe("the Pi shop as shipped: PCM now, PI coming soon", { timeout: 30_000 }, () => {
  beforeEach(() => {
    piVariant.open = false;
    core.listPi = false; // as in production: core does not list PI yet
    vi.resetModules();
  });
  afterEach(() => {
    piVariant.open = true;
    core.listPi = true;
    vi.resetModules();
  });

  it("stays open (no fallback) while core lists PCM but not PI", async () => {
    const { GET } = await import("@/app/api/config/route");
    const json = await (await GET(new Request("https://pi.morapay.shop/api/config"))).json();
    expect(json.data.fallback).toBe(false);
  });

  it("takes a PCM buy end to end with no token named (PCM is the default)", async () => {
    const res = await call("orders", {
      fiatAmount: "50",
      currency: "GHS",
      country: "GH",
      methodId: "momo_mtn",
      methodKind: "mobile_money",
      phoneNumber: "0244123456",
      walletAddress: EVM_WALLET,
    });
    expect(res.status).toBe(200);
    expect(core.initiateOnramp).toHaveBeenCalledWith(
      expect.objectContaining({ target_chain_id: "10", target_token_symbol: "PCM", target_token_address: PCM }),
      expect.anything(),
    );
  });

  it("defaults to PCM and shows PI as coming soon, with buying and selling off", async () => {
    const { ShopConfigSchema } = await import("@/config/schema");
    const { shopTokens, findShopToken } = await import("@/lib/shop-tokens");
    const pi = ShopConfigSchema.parse((await import("@/examples/pi.config")).default);
    expect(findShopToken(pi, null)?.ticker).toBe("PCM");
    const [piToken] = shopTokens(pi);
    expect(piToken).toMatchObject({ ticker: "PI", comingSoon: true, buyEnabled: false, sellEnabled: false });
    const { GET } = await import("@/app/api/config/route");
    const json = await (await GET(new Request("https://pi.morapay.shop/api/config"))).json();
    expect(json.data.tokens.map((t: { ticker: string; comingSoon: boolean; buy: boolean }) => [t.ticker, t.comingSoon, t.buy])).toEqual([
      ["PI", true, false],
      ["PCM", false, true],
    ]);
  });

  it("quotes PCM by default and refuses PI as coming soon", async () => {
    expect((await call("quote", { action: "ONRAMP", inputAmount: "500", inputCurrency: "GHS" })).status).toBe(200);
    expect(core.getQuote).toHaveBeenLastCalledWith(expect.objectContaining({ outputCurrency: "PCM", chain: "10" }), expect.anything());
    core.getQuote.mockClear();
    const pi = await call("quote", { action: "ONRAMP", inputAmount: "500", inputCurrency: "GHS", token: "PI" });
    expect(pi).toMatchObject({ status: 400, json: { code: "token.coming_soon", message: "PI is coming soon." } });
    expect(core.getQuote).not.toHaveBeenCalled();
  });

  it("opens a PCM sell (sell tab on) and refuses a PI sell as coming soon", async () => {
    const sell = (token?: string) =>
      call("sell", {
        tokenAmount: "1000",
        currency: "GHS",
        walletAddress: EVM_WALLET,
        bankCode: "MTN",
        accountNumber: "0244123456",
        ...(token ? { token } : {}),
      });
    const pcm = await sell();
    expect(pcm.status).toBe(200);
    expect(core.initiateOfframp).toHaveBeenCalledWith(
      expect.objectContaining({ source_chain_id: "10", source_token_symbol: "PCM", source_token_address: PCM }),
      expect.anything(),
    );
    core.initiateOfframp.mockClear();
    expect(await sell("PI")).toMatchObject({ status: 400, json: { code: "token.coming_soon" } });
    expect(core.initiateOfframp).not.toHaveBeenCalled();
  });
});

