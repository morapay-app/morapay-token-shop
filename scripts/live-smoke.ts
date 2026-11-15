/**
 * Read-only live smoke against Morapay (section 15).
 * Does NOT place orders.
 */
import { getRampConfig, getQuote, isTokenSupported } from "../lib/morapay/ramp";
import milan from "../examples/milan.config";

async function main() {
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
    outputCurrency: "MILAN",
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
