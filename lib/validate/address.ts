import { getAddress, isAddress } from "viem";
import bs58 from "bs58";
import { getChain } from "@/config/chains";

export type AddressValidation =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

const ZERO = "0x0000000000000000000000000000000000000000";

export function validateWalletAddress(
  address: string,
  chainId: number,
  tokenContract?: string,
): AddressValidation {
  const trimmed = address.trim();
  if (!trimmed) return { ok: false, reason: "Enter a wallet address." };

  const chain = getChain(chainId);
  if (!chain) return { ok: false, reason: "Unsupported chain." };

  if (chain.kind === "evm") {
    if (!isAddress(trimmed, { strict: false })) {
      return { ok: false, reason: "Enter a valid wallet address." };
    }
    let normalized: string;
    try {
      normalized = getAddress(trimmed);
    } catch {
      return { ok: false, reason: "Enter a valid wallet address." };
    }
    if (normalized.toLowerCase() === ZERO) {
      return { ok: false, reason: "That address cannot receive tokens." };
    }
    if (
      tokenContract &&
      normalized.toLowerCase() === tokenContract.toLowerCase()
    ) {
      return {
        ok: false,
        reason: "Do not enter the token contract address. Use your own wallet.",
      };
    }
    return { ok: true, normalized };
  }

  if (chain.kind === "solana") {
    try {
      const decoded = bs58.decode(trimmed);
      if (decoded.length !== 32) {
        return { ok: false, reason: "Enter a valid Solana address." };
      }
      if (
        tokenContract &&
        trimmed.toLowerCase() === tokenContract.toLowerCase()
      ) {
        return {
          ok: false,
          reason:
            "Do not enter the token mint address. Use your own wallet.",
        };
      }
      return { ok: true, normalized: trimmed };
    } catch {
      return { ok: false, reason: "Enter a valid Solana address." };
    }
  }

  return { ok: false, reason: "Unsupported chain for address validation." };
}
