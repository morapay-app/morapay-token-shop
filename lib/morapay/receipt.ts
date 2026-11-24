import { getChain } from "@/config/chains";
import type { RampPhase } from "./status";

/**
 * The only order fields that may reach a browser. Core's record also carries the customer's name,
 * email and phone: an order reference is not a secret, so none of that is ever passed through.
 */
export type OrderReceipt = {
  ref: string;
  direction: "buy" | "sell";
  phase: RampPhase;
  paid: { amount: string; currency: string } | null;
  received: { amount: string; currency: string; estimated: boolean } | null;
  method: string | null;
  chainName: string | null;
  /** Transaction on the token's own chain. */
  deliveryTx: { hash: string; url: string } | null;
  /** Source-chain swap (Base) when the token is delivered on another chain. */
  swapTx: { hash: string; url: string } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {};
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null;

const NETWORK_LABEL: Record<string, string> = {
  mtn: "MTN MoMo",
  vodafone: "Telecel Cash",
  telecel: "Telecel Cash",
  airteltigo: "AirtelTigo Money",
};

function methodLabel(tx: Raw): string | null {
  const payment = obj(tx.payment);
  const method = str(payment.method);
  if (method === "bank_transfer") return "Bank transfer";
  const network = str(payment.network)?.toLowerCase();
  if (network && NETWORK_LABEL[network]) return NETWORK_LABEL[network];
  return method === "mobile_money" ? "Mobile money" : null;
}

const EVM_HASH = /^0x[a-fA-F0-9]{64}$/;
const BARE_HASH = /^[a-fA-F0-9]{64}$/;

function splitHashes(hash: string | null, chainId: number) {
  const chain = getChain(chainId);
  if (!hash || !chain) return { deliveryTx: null, swapTx: null };
  const ownChain =
    chain.kind === "evm"
      ? EVM_HASH.test(hash)
      : chain.kind === "xrpl" || chain.kind === "pi"
        ? BARE_HASH.test(hash)
        : !EVM_HASH.test(hash);
  if (ownChain) return { deliveryTx: { hash, url: chain.explorerTx(hash) }, swapTx: null };
  if (EVM_HASH.test(hash)) {
    return { deliveryTx: null, swapTx: { hash, url: `https://basescan.org/tx/${hash}` } };
  }
  return { deliveryTx: null, swapTx: null };
}

export function buildReceipt(
  ref: string,
  raw: Raw,
  phase: RampPhase,
  txHash: string | null | undefined,
  chainId: number,
): OrderReceipt {
  const direction = str(raw.direction)?.toLowerCase() === "offramp" ? "sell" : "buy";
  const fiat = str(raw.fiatCurrency ?? raw.currency)?.toUpperCase() ?? "";
  const paidAmount = str(raw.customerAmount ?? raw.fiatAmount ?? raw.amount);
  const receiveAmount = str(raw.receiveAmount);
  const receiveCurrency = str(raw.receiveCurrency);
  return {
    ref,
    direction,
    phase,
    paid: direction === "buy" && paidAmount ? { amount: paidAmount, currency: fiat } : null,
    received:
      receiveAmount && receiveCurrency
        ? {
            amount: receiveAmount,
            currency: receiveCurrency.toUpperCase(),
            estimated: raw.receiveAmountEstimated === true,
          }
        : null,
    method: methodLabel(raw),
    chainName: getChain(chainId)?.name ?? null,
    ...splitHashes(str(txHash), chainId),
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  };
}
