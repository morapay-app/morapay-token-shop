/** Fixtures from section 6 (15 Nov 2026). */

export const rampConfigFixture = {
  supportedCurrencies: ["ghs", "ngn"],
  fiatCorridors: [
    {
      currency: "ghs",
      country: "GH",
      buyLimits: { minFiat: 50, maxFiat: 2900 },
      onrampPaymentMethods: ["mobile_money", "bank_transfer"],
      offrampPayoutMethods: ["mobile_money", "bank_transfer"],
    },
    {
      currency: "ngn",
      country: "NG",
      buyLimits: { minFiat: 3000, maxFiat: 5_000_000 },
      onrampPaymentMethods: ["bank_transfer"],
      offrampPayoutMethods: ["bank_transfer"],
    },
  ],
  supportedOnrampTargets: [
    {
      chainId: 56,
      chainCode: "bsc",
      symbol: "MILAN",
      tokenAddress: "0x5c9ff301ec2d882b635813739cc07330788d7322",
      decimals: 18,
    },
  ],
  supportedOfframpSources: [],
  limits: { sell: { token: "USDC", minToken: 4, maxToken: 7000 } },
};

export const quoteFixture = {
  quoteId: "q_test_100ghs_milan",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  exchangeRate: "0.001528",
  input: { amount: "100.00", currency: "GHS" },
  output: {
    amount: "65462.75",
    currency: "MILAN",
    chain: "56",
  },
  fees: {
    networkFee: "0.01",
    platformFee: "0.02745",
    totalFee: "0.03745",
  },
};

export const banksGhsFixture = {
  currency: "ghs",
  country: "GH",
  institutions: [
    { code: "0004", name: "MTN", kind: "mobile_money" },
    { code: "0006", name: "VODAFONE", kind: "mobile_money" },
    { code: "0005", name: "AIRTEL", kind: "mobile_money" },
    { code: "0009", name: "TIGO", kind: "mobile_money" },
    { code: "3003", name: "GCB", kind: "bank" },
  ],
};
