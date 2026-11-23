import { describe, expect, it } from "vitest";
import {
  buildInitiateOfframpPayload,
  xrplOfframpDepositError,
} from "@/lib/morapay/ramp";

describe("offramp payloads", () => {
  it("uses source* fields for merchant offramp", () => {
    const payload = buildInitiateOfframpPayload({
      currency: "ghs",
      token_amount: "50",
      wallet_address: "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv",
      bank_code: "0004",
      account_number: "0240000000",
      source_chain_id: "144",
      source_token_symbol: "xrp",
      source_token_address: "xrp",
      client_channel: "browser",
    });
    expect(payload.sourceChainId).toBe(144);
    expect(payload.sourceTokenSymbol).toBe("XRP");
    expect(payload.sourceTokenAddress).toBeUndefined();
    expect(payload.targetChainId).toBeUndefined();
  });

  it("includes sourceTokenAddress for EVM sells", () => {
    const contract = "0x5C9Ff301Ec2d882B635813739cC07330788d7322";
    const payload = buildInitiateOfframpPayload({
      currency: "ghs",
      token_amount: "100",
      wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      source_chain_id: "56",
      source_token_symbol: "MILAN",
      source_token_address: contract,
    });
    expect(payload.sourceTokenAddress).toBe(contract);
  });

  it("xrplOfframpDepositError requires deposit tag", () => {
    expect(
      xrplOfframpDepositError(144, {
        depositAddress: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      }),
    ).toMatch(/tag/i);
    expect(
      xrplOfframpDepositError(144, {
        depositAddress: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
        depositDestinationTag: 99,
      }),
    ).toBeNull();
    expect(
      xrplOfframpDepositError(56, {
        depositAddress: "0xabc",
      }),
    ).toBeNull();
  });
});