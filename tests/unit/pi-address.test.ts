import { describe, expect, it } from "vitest";
import {
  crc16Xmodem,
  decodeStrKey,
  encodePiPublicKey,
  validatePiAddress,
} from "@/lib/validate/pi-address";
import {
  validateWalletAddress,
  walletAddressesEqual,
  walletStorageKey,
} from "@/lib/validate/address";
import { PI_CHAIN_ID } from "@/config/chains";

/** Well-known valid Stellar-format public keys (Pi uses the same StrKey format). */
const G1 = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
const G2 = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
const SEED = "SBU2RRGLXH3E5CQHTD3ODLDF2BWDCYUSSBLLZ5GNW7JXHDIYKXZWHOKR";
const MUXED = "MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAAAACJUQ";

describe("Pi address validation", () => {
  it("crc16-xmodem matches the reference check value", () => {
    expect(crc16Xmodem(new TextEncoder().encode("123456789"))).toBe(0x31c3);
  });

  it("accepts valid G… addresses", () => {
    expect(validatePiAddress(G1)).toEqual({ ok: true, normalized: G1 });
    expect(validatePiAddress(G2)).toEqual({ ok: true, normalized: G2 });
  });

  it("trims and upper-cases input", () => {
    expect(validatePiAddress(`  ${G1.toLowerCase()} `)).toEqual({ ok: true, normalized: G1 });
  });

  it("round-trips an encoded public key", () => {
    const raw = new Uint8Array(32).map((_, i) => i * 7);
    const addr = encodePiPublicKey(raw);
    expect(addr).toHaveLength(56);
    expect(addr.startsWith("G")).toBe(true);
    expect(validatePiAddress(addr).ok).toBe(true);
    expect(Array.from(decodeStrKey(addr)!.payload)).toEqual(Array.from(raw));
  });

  it("rejects a bad checksum (one character changed)", () => {
    const bad = `${G2.slice(0, -1)}J`;
    expect(validatePiAddress(bad).ok).toBe(false);
  });

  it("rejects wrong length, prefix and alphabet", () => {
    expect(validatePiAddress(G1.slice(0, 55)).ok).toBe(false);
    expect(validatePiAddress(`X${G1.slice(1)}`).ok).toBe(false);
    expect(validatePiAddress(`${G1.slice(0, 10)}0${G1.slice(11)}`).ok).toBe(false);
    expect(validatePiAddress("").ok).toBe(false);
    expect(validatePiAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0").ok).toBe(false);
  });

  it("refuses secret keys with a warning", () => {
    const r = validatePiAddress(SEED);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/secret key/i);
  });

  it("refuses muxed M… addresses", () => {
    const r = validatePiAddress(MUXED);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/G…/);
  });

  it("is wired into validateWalletAddress for the Pi chain", () => {
    expect(validateWalletAddress(G1, PI_CHAIN_ID, "pi")).toEqual({ ok: true, normalized: G1 });
    expect(validateWalletAddress("rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", PI_CHAIN_ID).ok).toBe(false);
    expect(walletStorageKey(G1.toLowerCase(), PI_CHAIN_ID)).toBe(G1);
    expect(walletAddressesEqual(G1, G1.toLowerCase(), PI_CHAIN_ID)).toBe(true);
    expect(walletAddressesEqual(G1, G2, PI_CHAIN_ID)).toBe(false);
  });
});
