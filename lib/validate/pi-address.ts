/**
 * Pi Network addresses use Stellar StrKey: base32 (RFC 4648, no padding) of
 * version byte ‖ payload ‖ CRC16-XModem (little-endian).
 * G… = ed25519 public key (56 chars), M… = muxed account, S… = secret seed.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** StrKey version bytes (already shifted, as in stellar-base). */
const VERSION_ED25519_PUBLIC = 6 << 3; // 'G'
const VERSION_MED25519_PUBLIC = 12 << 3; // 'M'
const VERSION_ED25519_SEED = 18 << 3; // 'S'

function base32Decode(input: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  // Leftover bits must be zero padding (canonical encoding only).
  if (bits > 0 && (value & ((1 << bits) - 1)) !== 0) return null;
  return Uint8Array.from(out);
}

function base32Encode(data: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** CRC16-XModem (poly 0x1021, init 0). */
export function crc16Xmodem(data: Uint8Array): number {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

/** Decode a StrKey and return its version byte + payload when the checksum holds. */
export function decodeStrKey(
  encoded: string,
): { version: number; payload: Uint8Array } | null {
  const decoded = base32Decode(encoded);
  if (!decoded || decoded.length < 3) return null;
  const body = decoded.subarray(0, decoded.length - 2);
  const checksum = decoded[decoded.length - 2]! | (decoded[decoded.length - 1]! << 8);
  if (crc16Xmodem(body) !== checksum) return null;
  // Re-encode to reject non-canonical strings.
  if (base32Encode(decoded) !== encoded) return null;
  return { version: body[0]!, payload: body.subarray(1) };
}

/** Build a StrKey (used by tests and fixtures). */
export function encodeStrKey(version: number, payload: Uint8Array): string {
  const body = new Uint8Array(payload.length + 1);
  body[0] = version;
  body.set(payload, 1);
  const crc = crc16Xmodem(body);
  const full = new Uint8Array(body.length + 2);
  full.set(body);
  full[body.length] = crc & 0xff;
  full[body.length + 1] = crc >> 8;
  return base32Encode(full);
}

export function encodePiPublicKey(raw32: Uint8Array): string {
  if (raw32.length !== 32) throw new Error("ed25519 public key must be 32 bytes");
  return encodeStrKey(VERSION_ED25519_PUBLIC, raw32);
}

export type PiAddressValidation =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

/** G… Pi wallet address. Muxed (M…) and secret (S…) keys are refused. */
export function validatePiAddress(input: string): PiAddressValidation {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return { ok: false, reason: "Enter a Pi wallet address." };

  if (trimmed.startsWith("S") && trimmed.length === 56) {
    const seed = decodeStrKey(trimmed);
    if (seed?.version === VERSION_ED25519_SEED) {
      return {
        ok: false,
        reason: "That is a secret key. Never share it. Enter your G… wallet address.",
      };
    }
  }

  if (trimmed.startsWith("M")) {
    const muxed = decodeStrKey(trimmed);
    if (muxed?.version === VERSION_MED25519_PUBLIC) {
      return { ok: false, reason: "Use your G… Pi address. M… addresses are not supported." };
    }
  }

  if (!trimmed.startsWith("G") || trimmed.length !== 56) {
    return { ok: false, reason: "Enter a valid Pi address (56 characters, starts with G)." };
  }
  const decoded = decodeStrKey(trimmed);
  if (
    !decoded ||
    decoded.version !== VERSION_ED25519_PUBLIC ||
    decoded.payload.length !== 32
  ) {
    return { ok: false, reason: "Enter a valid Pi address. Check for typos." };
  }
  return { ok: true, normalized: trimmed };
}
