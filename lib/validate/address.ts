import { getAddress, isAddress } from "viem";
import bs58 from "bs58";
import {
  decodeAccountID,
  decodeXAddress,
  encodeAccountID,
  isValidClassicAddress,
  isValidXAddress,
} from "ripple-address-codec";
import { getChain } from "@/config/chains";

export type AddressValidation =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

const ZERO = "0x0000000000000000000000000000000000000000";

function normalizeClassicXrplAddress(address: string): string | null {
  try {
    return encodeAccountID(decodeAccountID(address));
  } catch {
    return null;
  }
}

function normalizeXrplAddress(trimmed: string): string | null {
  if (isValidClassicAddress(trimmed)) {
    return normalizeClassicXrplAddress(trimmed);
  }
  if (isValidXAddress(trimmed)) {
    try {
      const decoded = decodeXAddress(trimmed);
      if (decoded.test) return null;
      return encodeAccountID(decoded.accountId);
    } catch {
      return null;
    }
  }
  return null;
}

/** Normalised key for rate limits / lookups (EVM lowercase, XRPL canonical). */
export function walletStorageKey(address: string, chainId: number): string {
  const chain = getChain(chainId);
  if (chain?.kind === "evm") return address.toLowerCase();
  return address;
}

export function walletAddressesEqual(
  a: string,
  b: string,
  chainId: number,
): boolean {
  const chain = getChain(chainId);
  if (chain?.kind === "evm") {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

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

  if (chain.kind === "xrpl") {
    const normalized = normalizeXrplAddress(trimmed);
    if (!normalized) {
      return {
        ok: false,
        reason:
          "Enter a valid XRPL address (classic r… or mainnet X-address). Testnet X-addresses are not supported.",
      };
    }
    if (
      tokenContract &&
      normalized.toLowerCase() === tokenContract.toLowerCase()
    ) {
      return {
        ok: false,
        reason: "Do not enter the native asset id. Use your own wallet.",
      };
    }
    return { ok: true, normalized };
  }

  return { ok: false, reason: "Unsupported chain for address validation." };
}