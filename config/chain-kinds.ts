import type { ChainInfo } from "./chains";

export type ChainKind = ChainInfo["kind"];

/**
 * Everything that differs by kind of chain, except address codecs (lib/validate/address.ts).
 * Components read this instead of testing `chain.kind`.
 */
export type ChainKindSpec = {
  /** Asset id a shop must use when the chain's coin has no contract. */
  native?: {
    contract: string;
    label: string;
    decimals?: number;
    /** Other ids core may list the coin under, beside `contract`. */
    listedAs?: readonly string[];
    listedSymbol?: string;
  };
  /** Replaces the contract block on the token card. */
  nativeOnlyNote?: (ticker: string, chainName: string) => string;
  /** What a sell deposit must carry so it is matched to its order. */
  depositReference: "none" | "destination_tag" | "memo";
  /** Buyers may add a destination tag to their payout address. */
  payoutTag: boolean;
  /** A delivery hash on this kind of chain (anything else is a swap on another chain). */
  isTxHash: (hash: string) => boolean;
  wallet: {
    buyLabel: (chainName: string) => string;
    buyPlaceholder: string;
    buyHelp: { text: string; tipLabel?: string; tip?: string };
    sellLabel: string;
    sellPlaceholder?: string;
    /** FAQ: "Which wallet do I need?" */
    faq: string;
  };
};

const EVM_HASH = /^0x[a-fA-F0-9]{64}$/;
const BARE_HASH = /^[a-fA-F0-9]{64}$/;

export const isEvmTxHash = (hash: string) => EVM_HASH.test(hash);
const isBareTxHash = (hash: string) => BARE_HASH.test(hash);
const isOtherTxHash = (hash: string) => !EVM_HASH.test(hash);

const defaultWallet: ChainKindSpec["wallet"] = {
  buyLabel: (chainName) => `Your ${chainName} wallet address`,
  buyPlaceholder: "0x…",
  buyHelp: { text: "Find this in Trust Wallet, Binance Wallet, or MetaMask under Receive." },
  sellLabel: "Your sending wallet",
  faq: "Any wallet that supports the token’s chain (for BNB Chain: Trust Wallet, Binance Wallet, MetaMask, and others).",
};

const base: ChainKindSpec = {
  depositReference: "none",
  payoutTag: false,
  isTxHash: isOtherTxHash,
  wallet: defaultWallet,
};

const CHAIN_KINDS: Record<ChainKind, ChainKindSpec> = {
  evm: { ...base, isTxHash: isEvmTxHash },
  solana: { ...base, wallet: { ...defaultWallet, buyPlaceholder: "Solana address" } },
  xrpl: {
    native: { contract: "xrp", label: "XRPL" },
    depositReference: "destination_tag",
    payoutTag: true,
    isTxHash: isBareTxHash,
    wallet: {
      ...defaultWallet,
      buyPlaceholder: "r… or X-address",
      buyHelp: {
        text: "Use your XRPL classic address (r…) or mainnet X-address. Exchanges often require a destination tag below.",
      },
      sellPlaceholder: "r… or X-address",
    },
  },
  pi: {
    native: {
      contract: "pi",
      label: "Pi",
      decimals: 7,
      listedAs: ["native", ""],
      listedSymbol: "PI",
    },
    nativeOnlyNote: (ticker, chainName) =>
      `Native ${ticker} on ${chainName} only. Not a BNB Chain or other wrapped token.`,
    depositReference: "memo",
    payoutTag: false,
    isTxHash: isBareTxHash,
    wallet: {
      buyLabel: () => "Pi wallet address",
      buyPlaceholder: "G…",
      buyHelp: {
        text: "Must be a Pi Network wallet (starts with G), not PI on BNB or another chain.",
        tipLabel: "Where?",
        tip: "Open the Pi Wallet app and tap Receive to copy your G… address. PI sent to a BNB Chain or exchange deposit address for another network can't be recovered.",
      },
      sellLabel: "Your sending Pi wallet",
      sellPlaceholder: "G…",
      faq: "A Pi Network wallet. Its address starts with G.",
    },
  },
  other: base,
};

/** Unknown chains fall back to the plain EVM-style copy. */
export function chainKindSpec(chain: ChainInfo | undefined): ChainKindSpec {
  return chain ? CHAIN_KINDS[chain.kind] : base;
}
