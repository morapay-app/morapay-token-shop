export type ChainInfo = {
  chainId: number;
  name: string;
  shortName: string;
  kind: "evm" | "solana" | "xrpl" | "pi" | "other";
  explorerTx: (hash: string) => string;
  explorerAddress: (address: string) => string;
};

const chains: Record<number, ChainInfo> = {
  1: {
    chainId: 1,
    name: "Ethereum",
    shortName: "ETH",
    kind: "evm",
    explorerTx: (h) => `https://etherscan.io/tx/${h}`,
    explorerAddress: (a) => `https://etherscan.io/address/${a}`,
  },
  56: {
    chainId: 56,
    name: "BNB Chain",
    shortName: "BSC",
    kind: "evm",
    explorerTx: (h) => `https://bscscan.com/tx/${h}`,
    explorerAddress: (a) => `https://bscscan.com/address/${a}`,
  },
  137: {
    chainId: 137,
    name: "Polygon",
    shortName: "Polygon",
    kind: "evm",
    explorerTx: (h) => `https://polygonscan.com/tx/${h}`,
    explorerAddress: (a) => `https://polygonscan.com/address/${a}`,
  },
  8453: {
    chainId: 8453,
    name: "Base",
    shortName: "Base",
    kind: "evm",
    explorerTx: (h) => `https://basescan.org/tx/${h}`,
    explorerAddress: (a) => `https://basescan.org/address/${a}`,
  },
  42161: {
    chainId: 42161,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    kind: "evm",
    explorerTx: (h) => `https://arbiscan.io/tx/${h}`,
    explorerAddress: (a) => `https://arbiscan.io/address/${a}`,
  },
  42220: {
    chainId: 42220,
    name: "Celo",
    shortName: "Celo",
    kind: "evm",
    explorerTx: (h) => `https://celoscan.io/tx/${h}`,
    explorerAddress: (a) => `https://celoscan.io/address/${a}`,
  },
  101: {
    chainId: 101,
    name: "Solana",
    shortName: "Solana",
    kind: "solana",
    explorerTx: (h) => `https://solscan.io/tx/${h}`,
    explorerAddress: (a) => `https://solscan.io/account/${a}`,
  },
  144: {
    chainId: 144,
    name: "XRP Ledger",
    shortName: "XRPL",
    kind: "xrpl",
    explorerTx: (h) => `https://livenet.xrpl.org/transactions/${h}`,
    explorerAddress: (a) => `https://livenet.xrpl.org/accounts/${a}`,
  },
  /** Pi Network mainnet (Stellar protocol, G… accounts, text memos). Internal id used by Morapay core. */
  31415926: {
    chainId: 31415926,
    name: "Pi Network",
    shortName: "Pi",
    kind: "pi",
    explorerTx: (h) => `https://blockexplorer.minepi.com/mainnet/transactions/${h}`,
    explorerAddress: (a) => `https://blockexplorer.minepi.com/mainnet/accounts/${a}`,
  },
};

export const PI_CHAIN_ID = 31415926;

export function getChain(chainId: number): ChainInfo | undefined {
  return chains[chainId];
}

export function requireChain(chainId: number): ChainInfo {
  const c = getChain(chainId);
  if (!c) throw new Error(`Unsupported chainId: ${chainId}`);
  return c;
}

export { chains };
