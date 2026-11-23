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