/**
 * Read-only smoke for IPOD (signed merchant API). Does not place orders.
 */
import { getRampConfig, getQuote, isTokenSupported } from "../lib/morapay/ramp";
import { merchantSigningEnabled } from "../lib/morapay/merchant-config";
import ipod from "../examples/ipod.config";

async function main() {
  if (!merchantSigningEnabled()) {
    console.error("Set MORAPAY_MERCHANT_* keys before smoke:ipod");
    process.exit(1);
  }
  const config = await getRampConfig();
  const supported = isTokenSupported(
    config,
    ipod.token.chainId,
    ipod.token.contract,
  );
  const corridors = config.supportedCurrencies.map((c) => c.toUpperCase());
  console.log(
    JSON.stringify(
      { tokenSupported: supported, corridors, shopId: ipod.shopId },
      null,
      2,
    ),
  );

  for (const currency of ["NGN", "GHS"]) {
    if (!corridors.includes(currency)) continue;
    const inputAmount = currency === "NGN" ? "5000" : "100";
    const quote = await getQuote({
      action: "ONRAMP",
      inputAmount,
      inputCurrency: currency,
      outputCurrency: ipod.token.ticker,
      chain: String(ipod.token.chainId),
      tokenAddress: ipod.token.contract,
    });
    console.log(
      JSON.stringify(
        {
          currency,
          quoteOk: Number(quote.output.amount) > 0,
          outputAmount: quote.output.amount,
          outputCurrency: quote.output.currency,
        },
        null,
        2,
      ),
    );
  }

  if (!supported) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});