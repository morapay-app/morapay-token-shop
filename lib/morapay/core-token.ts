import { getChain } from "@/config/chains";

const NATIVE_XRP_CONTRACT = "xrp";
/** Morapay core rejects token addresses shorter than 8 characters. */
const CORE_MIN_TOKEN_ADDRESS_LEN = 8;

/** Token contract/mint to send to Morapay core, or omit for native XRP / Pi. */
export function merchantCoreTokenAddress(
  chainId: number,
  contractOrMint: string,
): string | undefined {
  const chain = getChain(chainId);
  if (chain?.kind === "xrpl" || chain?.kind === "pi") return undefined;
  if (contractOrMint.toLowerCase() === NATIVE_XRP_CONTRACT) return undefined;
  if (contractOrMint.length < CORE_MIN_TOKEN_ADDRESS_LEN) return undefined;
  return contractOrMint;
}