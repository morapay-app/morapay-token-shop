import { describe, expect, it } from "vitest";
import ipod from "@/examples/ipod.config";
import { isTokenSupported } from "@/lib/morapay/ramp";

describe("IPOD merchant ramp target", () => {
  it("matches Morapay catalog contract on Base", () => {
    const config = {
      supportedCurrencies: ["ghs", "ngn"],
      fiatCorridors: [],
      supportedOnrampTargets: [
        {
          chainId: 8453,
          symbol: "IPOD",
          tokenAddress: "0xA6af0cEa8FBC93E1eCcC00f1FdD9a0BBa251FeE1",
          decimals: 18,
        },
      ],
      supportedOfframpSources: [],
    };
    expect(
      isTokenSupported(config, ipod.token.chainId, ipod.token.contract),
    ).toBe(true);
  });
});