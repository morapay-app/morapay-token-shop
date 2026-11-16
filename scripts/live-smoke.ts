/**
 * Read-only live smoke against Morapay (signed merchant API).
 * Does NOT place orders. Requires merchant keys in env.
 */
import { getRampConfig, getQuote, isTokenSupported } from "../lib/morapay/ramp";
import { merchantSigningEnabled } from "../lib/morapay/merchant-config";
import milan from "../examples/milan.config";

async function main() {
  if (!merchantSigningEnabled()) {
    console.error("Set MORAPAY_MERCHANT_* keys before smoke:live");
    process.exit(1);
  }
  const config = await getRampConfig();
  const supported = isTokenSupported(
    config,
    milan.token.chainId,
    milan.token.contract,
  );
  const corridors = config.supportedCurrencies.map((c) => c.toLowerCase());
  console.log(
    JSON.stringify(
      {
        morapay: "ok",
        tokenSupported: supported,
        corridors,
      },
      null,
      2,
    ),
  );

  const quote = await getQuote({
    action: "ONRAMP",
    inputAmount: "100",
    inputCurrency: "GHS",
    outputCurrency: milan.token.ticker,
    chain: "56",
  });
  console.log(
    JSON.stringify(
      {
        quoteOk: Number(quote.output.amount) > 0,
        outputAmount: quote.output.amount,
        outputCurrency: quote.output.currency,
      },
      null,
      2,
    ),
  );

  if (!supported) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
