import { afterEach, describe, expect, it } from "vitest";
import {
  buildInitiateOnrampPayload,
  isTokenSupported,
  parseOfframpDepositInfo,
} from "@/lib/morapay/ramp";
import { rampConfigFixture } from "../mocks/morapay";

describe("XRPL ramp payloads", () => {
  afterEach(() => {
    delete process.env.SHOP_ID;
  });

  it("includes payoutDestinationTag when set", () => {
    process.env.SHOP_ID = "xrp";
    const payload = buildInitiateOnrampPayload({
      currency: "ngn",
      fiat_amount: "10000",
      payout_wallet_address: "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv",
      wallet_address: "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv",
      client_channel: "browser",
      target_chain_id: "144",
      target_token_symbol: "XRP",
      target_token_address: "xrp",
      quoted_to_amount: "25.5",
      payout_destination_tag: 998877,
    });
    expect(payload.payoutDestinationTag).toBe(998877);
    expect(payload.targetChainId).toBe("144");
    expect(payload.targetTokenAddress).toBeUndefined();
  });

  it("omits targetTokenAddress for native XRP", () => {
    const payload = buildInitiateOnrampPayload({
      currency: "ngn",
      fiat_amount: "5000",
      payout_wallet_address: "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv",
      wallet_address: "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv",
      client_channel: "browser",
      target_chain_id: "144",
      target_token_symbol: "XRP",
      quoted_to_amount: "10",
    });
    expect(payload.targetTokenAddress).toBeUndefined();
  });

  it("omits payoutDestinationTag when absent", () => {
    const payload = buildInitiateOnrampPayload({
      currency: "ghs",
      fiat_amount: "100",
      payout_wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      client_channel: "browser",
      target_chain_id: "56",
      target_token_symbol: "MILAN",
      quoted_to_amount: "1",
    });
    expect(payload.payoutDestinationTag).toBeUndefined();
  });

  it("isTokenSupported matches native xrp contract", () => {
    const cfg = {
      ...rampConfigFixture,
      supportedOnrampTargets: [
        {
          chainId: 144,
          chainCode: "xrpl",
          symbol: "XRP",
          tokenAddress: "xrp",
          decimals: 6,
        },
      ],
    };
    expect(isTokenSupported(cfg, 144, "xrp")).toBe(true);
    expect(isTokenSupported(cfg, 144, "XRP")).toBe(true);
    expect(isTokenSupported(cfg, 56, "xrp")).toBe(false);
  });

  it("parseOfframpDepositInfo prefers deposit.destinationTag", () => {
    const info = parseOfframpDepositInfo({
      deposit: {
        address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
        destinationTag: 424242,
      },
    });
    expect(info.depositAddress).toContain("rN7n");
    expect(info.depositDestinationTag).toBe(424242);
  });
});