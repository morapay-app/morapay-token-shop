export type DestinationTagValidation =
  | { ok: true; value: number | undefined }
  | { ok: false; reason: string };

const UINT32_MAX = 4_294_967_295;

/** Optional XRPL destination tag — must be a uint32 when provided. */
export function validateDestinationTag(
  raw: string | undefined | null,
): DestinationTagValidation {
  if (raw == null || String(raw).trim() === "") {
    return { ok: true, value: undefined };
  }
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, reason: "Destination tag must be a whole number." };
  }
  const n = Number(trimmed);
  if (!Number.isSafeInteger(n) || n < 0 || n > UINT32_MAX) {
    return {
      ok: false,
      reason: `Destination tag must be between 0 and ${UINT32_MAX}.`,
    };
  }
  return { ok: true, value: n };
}

const TAG_MISMATCH =
  "Destination tag does not match the tag embedded in this X-address.";

/** Merge optional typed tag with an X-address embedded tag; reject conflicts. */
export function resolvePayoutDestinationTag(
  typedRaw: string | undefined | null,
  embedded?: number,
): DestinationTagValidation {
  const typed = validateDestinationTag(typedRaw);
  if (!typed.ok) return typed;
  if (
    embedded != null &&
    typed.value != null &&
    typed.value !== embedded
  ) {
    return { ok: false, reason: TAG_MISMATCH };
  }
  return { ok: true, value: typed.value ?? embedded };
}

export { TAG_MISMATCH };