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
import type { ChainKind } from "@/config/chain-kinds";
import { validatePiAddress } from "./pi-address";

export type AddressValidation =
  | { ok: true; normalized: string; embeddedDestinationTag?: number }
  | { ok: false; reason: string };

const ZERO = "0x0000000000000000000000000000000000000000";

function normalizeClassicXrplAddress(address: string): string | null {
  try {
    return encodeAccountID(decodeAccountID(address));
  } catch {
    return null;
  }
}

function xrplTagFromDecoded(tag: number | false): number | undefined {
  if (tag === false || tag == null) return undefined;
  return tag;
}

export function parseXrplWalletInput(
  input: string,
): { classicAddress: string; embeddedDestinationTag?: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isValidClassicAddress(trimmed)) {
    const classicAddress = normalizeClassicXrplAddress(trimmed);
    if (!classicAddress) return null;
    return { classicAddress };
  }

  if (isValidXAddress(trimmed)) {
    try {
      const decoded = decodeXAddress(trimmed);
      if (decoded.test) return null;
      const classicAddress = encodeAccountID(decoded.accountId);
      const embeddedDestinationTag = xrplTagFromDecoded(decoded.tag);
      return { classicAddress, embeddedDestinationTag };
    } catch {
      return null;
    }
  }

  return null;
}

type AddressRules = {
  validate: (address: string, tokenContract?: string) => AddressValidation;
  /** Same account, same key: for rate limits and comparisons. */
  key: (address: string) => string;
};

const bad = (reason: string): AddressValidation => ({ ok: false, reason });

function validateEvm(address: string, tokenContract?: string): AddressValidation {
  if (!isAddress(address, { strict: false })) return bad("Enter a valid wallet address.");
  let normalized: string;
  try {
    normalized = getAddress(address);
  } catch {
    return bad("Enter a valid wallet address.");
  }
  if (normalized.toLowerCase() === ZERO) return bad("That address cannot receive tokens.");
  if (tokenContract && normalized.toLowerCase() === tokenContract.toLowerCase()) {
    return bad("Do not enter the token contract address. Use your own wallet.");
  }
  return { ok: true, normalized };
}

function validateSolana(address: string, tokenContract?: string): AddressValidation {
  try {
    if (bs58.decode(address).length !== 32) return bad("Enter a valid Solana address.");
  } catch {
    return bad("Enter a valid Solana address.");
  }
  if (tokenContract && address.toLowerCase() === tokenContract.toLowerCase()) {
    return bad("Do not enter the token mint address. Use your own wallet.");
  }
  return { ok: true, normalized: address };
}

function validateXrpl(address: string, tokenContract?: string): AddressValidation {
  const parsed = parseXrplWalletInput(address);
  if (!parsed) {
    return bad(
      "Enter a valid XRPL address (classic r… or mainnet X-address). Testnet X-addresses are not supported.",
    );
  }
  if (tokenContract && parsed.classicAddress.toLowerCase() === tokenContract.toLowerCase()) {
    return bad("Do not enter the native asset id. Use your own wallet.");
  }
  return {
    ok: true,
    normalized: parsed.classicAddress,
    embeddedDestinationTag: parsed.embeddedDestinationTag,
  };
}

/** One entry per chain kind; other per-kind rules live in config/chain-kinds.ts. */
const RULES: Record<ChainKind, AddressRules> = {
  evm: { validate: validateEvm, key: (a) => a.toLowerCase() },
  solana: { validate: validateSolana, key: (a) => a },
  xrpl: {
    validate: validateXrpl,
    key: (a) => parseXrplWalletInput(a)?.classicAddress ?? a,
  },
  pi: {
    validate: (a) => validatePiAddress(a),
    key: (a) => a.trim().toUpperCase(),
  },
  other: {
    validate: () => bad("Unsupported chain for address validation."),
    key: (a) => a,
  },
};

function rulesFor(chainId: number): AddressRules | undefined {
  const chain = getChain(chainId);
  return chain && RULES[chain.kind];
}

/** Normalised key for rate limits / lookups (EVM lowercase, XRPL canonical). */
export function walletStorageKey(address: string, chainId: number): string {
  return rulesFor(chainId)?.key(address) ?? address;
}

export function walletAddressesEqual(a: string, b: string, chainId: number): boolean {
  return walletStorageKey(a, chainId) === walletStorageKey(b, chainId);
}

export function validateWalletAddress(
  address: string,
  chainId: number,
  tokenContract?: string,
): AddressValidation {
  const trimmed = address.trim();
  if (!trimmed) return bad("Enter a wallet address.");
  const rules = rulesFor(chainId);
  if (!rules) return bad("Unsupported chain.");
  return rules.validate(trimmed, tokenContract);
}
