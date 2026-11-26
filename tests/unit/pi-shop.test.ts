import { describe, expect, it } from "vitest";
import { ShopConfigSchema, lintShopConfig, type ShopConfigInput } from "@/config/schema";
import { getChain, PI_CHAIN_ID } from "@/config/chains";
import { merchantCoreTokenAddress } from "@/lib/morapay/core-token";
import { buildInitiateOfframpPayload, isTokenSupported } from "@/lib/morapay/ramp";
import pi from "@/examples/pi.config";
import xrp from "@/examples/xrp.config";

function clone(): ShopConfigInput {
  return structuredClone(pi) as ShopConfigInput;
}

describe("pi shop config", () => {
  it("parses", () => {
    const r = ShopConfigSchema.safeParse(pi);
    expect(r.success).toBe(true);
  });

  it("has clean copy", () => {
    expect(lintShopConfig(pi)).toEqual([]);
  });

  it("is native PI on Pi Network with 7 decimals", () => {
    expect(pi.shopId).toBe("pi");
    expect(pi.token).toMatchObject({ ticker: "PI", name: "Pi", chainId: 31415926, decimals: 7, contract: "pi" });
    expect(getChain(PI_CHAIN_ID)).toMatchObject({ kind: "pi", name: "Pi Network" });
  });

  it("matches the XRP shop countries and has no shop-level PI cap", () => {
    expect(pi.countries).toEqual(xrp.countries);
    // Off until the sell wallets' Privy policy allows PCM approvals on Optimism (PI is coming soon).
    expect(pi.sell.enabled).toBe(false);
    expect(pi.token.comingSoon).toBe(true);
    expect("maxToken" in pi.sell).toBe(false);
    expect("minToken" in pi.sell).toBe(false);
  });

  it("rejects a non-native contract and wrong decimals on Pi", () => {
    const a = clone();
    a.token.contract = "0x5C9Ff301Ec2d882B635813739cC07330788d7322";
    expect(ShopConfigSchema.safeParse(a).success).toBe(false);
    const b = clone();
    b.token.decimals = 18;
    expect(ShopConfigSchema.safeParse(b).success).toBe(false);
  });

  it("sends no token address to core for native PI", () => {
    expect(merchantCoreTokenAddress(PI_CHAIN_ID, "pi")).toBeUndefined();
    const payload = buildInitiateOfframpPayload({
      currency: "ghs",
      token_amount: "10",
      wallet_address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
      source_chain_id: String(PI_CHAIN_ID),
      source_token_symbol: "pi",
      source_token_address: "pi",
    });
    expect(payload.sourceChainId).toBe(PI_CHAIN_ID);
    expect(payload.sourceTokenSymbol).toBe("PI");
    expect(payload.sourceTokenAddress).toBeUndefined();
  });

  it("treats native PI as supported however core lists it", () => {
    const base = { supportedCurrencies: [], fiatCorridors: [], supportedOfframpSources: [] };
    const target = (tokenAddress: string, symbol = "PI") => ({
      ...base,
      supportedOnrampTargets: [{ chainId: PI_CHAIN_ID, symbol, tokenAddress, decimals: 7 }],
    });
    expect(isTokenSupported(target("pi"), PI_CHAIN_ID, "pi")).toBe(true);
    expect(isTokenSupported(target("native"), PI_CHAIN_ID, "pi")).toBe(true);
    expect(isTokenSupported(target("whatever", "PI"), PI_CHAIN_ID, "pi")).toBe(true);
    expect(isTokenSupported(target("pi"), 56, "pi")).toBe(false);
  });
});
