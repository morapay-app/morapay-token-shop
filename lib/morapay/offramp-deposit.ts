import { getChain } from "@/config/chains";

/**
 * Deposit instructions for a sell (offramp) order, read from core's initiate / transaction
 * responses. Every field name core may use is mapped here, so a rename is a one-line change.
 *
 * - XRP: address + destination tag.
 * - Pi: address + text memo + exact amount (memo-matched deposits).
 */
export type OfframpDeposit = {
  depositAddress: string;
  depositDestinationTag?: number | string;
  /** Pi text memo (core field `depositMemo`, also `memo`). */
  depositMemo?: string;
  /** Exact token amount to send, as a decimal string. */
  depositAmount?: string;
  /** ISO time the deposit window closes. */
  depositExpiresAt?: string;
};

type Raw = Record<string, unknown>;

function obj(v: unknown): Raw | undefined {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : undefined;
}

function first(...values: unknown[]): unknown {
  for (const v of values) {
    if (v == null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    return v;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

/** Field names, in priority order. `deposit.*` (nested) wins over top-level. */
const FIELDS = {
  address: ["address", "depositAddress", "deposit_address"],
  destinationTag: [
    "destinationTag",
    "destination_tag",
    "depositDestinationTag",
    "deposit_destination_tag",
  ],
  memo: ["depositMemo", "deposit_memo", "memo"],
  amount: [
    "depositAmount",
    "deposit_amount",
    "expectedAmount",
    "expected_amount",
    "expectedAmountPi",
    "amount",
  ],
  expiresAt: ["depositExpiresAt", "deposit_expires_at", "expiresAt", "expires_at"],
} as const;

/** Top-level keys that are NOT deposit fields (e.g. `amount` is the fiat/order amount). */
const NESTED_ONLY = new Set(["address", "destinationTag", "destination_tag", "amount", "expiresAt", "expires_at"]);

function pick(raw: Raw, keys: readonly string[]): unknown {
  const nested = obj(raw.deposit);
  const fromNested = nested ? first(...keys.map((k) => nested[k])) : undefined;
  if (fromNested !== undefined) return fromNested;
  return first(...keys.filter((k) => !NESTED_ONLY.has(k)).map((k) => raw[k]));
}

export function parseOfframpDeposit(raw: Raw | null | undefined): OfframpDeposit {
  if (!raw) return { depositAddress: "" };
  const tagRaw = pick(raw, FIELDS.destinationTag);
  const depositDestinationTag =
    typeof tagRaw === "number" || typeof tagRaw === "string" ? tagRaw : undefined;
  const out: OfframpDeposit = {
    depositAddress: str(pick(raw, FIELDS.address)) ?? "",
  };
  if (depositDestinationTag != null) out.depositDestinationTag = depositDestinationTag;
  const memo = str(pick(raw, FIELDS.memo));
  if (memo) out.depositMemo = memo;
  const amount = str(pick(raw, FIELDS.amount));
  if (amount) out.depositAmount = amount;
  const expires = str(pick(raw, FIELDS.expiresAt));
  if (expires) out.depositExpiresAt = expires;
  return out;
}

/** Fill gaps in `primary` from `fallback` (e.g. transaction read first, initiate response second). */
export function mergeOfframpDeposit(
  primary: OfframpDeposit,
  fallback: OfframpDeposit,
): OfframpDeposit {
  const out: OfframpDeposit = {
    depositAddress: primary.depositAddress || fallback.depositAddress,
  };
  const tag = primary.depositDestinationTag ?? fallback.depositDestinationTag;
  if (tag != null) out.depositDestinationTag = tag;
  const memo = primary.depositMemo ?? fallback.depositMemo;
  if (memo) out.depositMemo = memo;
  const amount = primary.depositAmount ?? fallback.depositAmount;
  if (amount) out.depositAmount = amount;
  const expires = primary.depositExpiresAt ?? fallback.depositExpiresAt;
  if (expires) out.depositExpiresAt = expires;
  return out;
}

/** Pi text memos are at most 28 bytes. */
export const PI_MEMO_MAX_BYTES = 28;

/** Refuse to show deposit instructions the user could act on wrongly. Terse, user-facing. */
export function offrampDepositError(chainId: number, info: OfframpDeposit): string | null {
  const kind = getChain(chainId)?.kind;
  if (kind === "xrpl") {
    if (!info.depositAddress) return "Missing platform deposit address. Please contact support.";
    if (info.depositDestinationTag == null || String(info.depositDestinationTag).trim() === "") {
      return "Missing deposit destination tag. Do not send XRP until support provides a tag.";
    }
    return null;
  }
  if (kind === "pi") {
    if (!info.depositAddress) return "Missing deposit address. Do not send PI. Contact support.";
    if (!info.depositMemo) return "Missing deposit memo. Do not send PI. Contact support.";
    if (new TextEncoder().encode(info.depositMemo).length > PI_MEMO_MAX_BYTES) {
      return "Invalid deposit memo. Do not send PI. Contact support.";
    }
    return null;
  }
  return null;
}
