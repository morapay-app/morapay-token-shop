import { describe, expect, it } from "vitest";
import { classicAddressToXAddress } from "ripple-address-codec";
import {
  validateWalletAddress,
  walletAddressesEqual,
  walletStorageKey,
} from "@/lib/validate/address";

const CONTRACT = "0x5C9Ff301Ec2d882B635813739cC07330788d7322";
const VALID = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

describe("address validation", () => {
  it("accepts checksummed and lowercase EVM, normalises", () => {
    const a = validateWalletAddress(VALID, 56, CONTRACT);
    expect(a.ok).toBe(true);
    const b = validateWalletAddress(VALID.toLowerCase(), 56, CONTRACT);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.normalized).toBe(b.normalized);
  });

  it("rejects zero address and token contract", () => {
    expect(
      validateWalletAddress(
        "0x0000000000000000000000000000000000000000",
        56,
        CONTRACT,
      ).ok,
    ).toBe(false);
    expect(validateWalletAddress(CONTRACT, 56, CONTRACT).ok).toBe(false);
  });

  it("accepts XRPL classic and mainnet X-address, rejects testnet X-address", () => {
    const classic = "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv";
    expect(validateWalletAddress(classic, 144, "xrp").ok).toBe(true);
    const xMain = classicAddressToXAddress(classic, false, false);
    const xTest = classicAddressToXAddress(classic, false, true);
    const main = validateWalletAddress(xMain, 144, "xrp");
    expect(main.ok).toBe(true);
    expect(validateWalletAddress(xTest, 144, "xrp").ok).toBe(false);
    expect(validateWalletAddress("xrp", 144, "xrp").ok).toBe(false);
  });

  it("preserves XRPL case for storage keys", () => {
    const classic = "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv";
    expect(walletStorageKey(classic, 144)).toBe(classic);
    expect(walletAddressesEqual(classic, classic, 144)).toBe(true);
  });

  it("accepts Solana for chain 101 and rejects for EVM shops", () => {
    // 32-byte base58 sample (System Program)
    const sol = "11111111111111111111111111111111";
    expect(validateWalletAddress(sol, 101).ok).toBe(true);
    expect(validateWalletAddress(sol, 56, CONTRACT).ok).toBe(false);
  });
});
