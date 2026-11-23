import { describe, expect, it } from "vitest";
import { walletAddressGroups, walletConfirmKey } from "@/lib/wallet-confirm";

describe("wallet confirmation", () => {
  it("belongs to one address and tag", () => {
    const key = walletConfirmKey("rL3P1rAUMX6DA97XRzmS1krENYxXBdhC6P", "4000123");
    expect(walletConfirmKey(" rL3P1rAUMX6DA97XRzmS1krENYxXBdhC6P ", "4000123")).toBe(key);
    expect(walletConfirmKey("rL3P1rAUMX6DA97XRzmS1krENYxXBdhC6Q", "4000123")).not.toBe(key);
    expect(walletConfirmKey("rL3P1rAUMX6DA97XRzmS1krENYxXBdhC6P", "4000124")).not.toBe(key);
    expect(walletConfirmKey("rL3P1rAUMX6DA97XRzmS1krENYxXBdhC6P", "")).not.toBe(key);
    expect(walletConfirmKey("0xabc", null)).toBe(walletConfirmKey("0xabc", ""));
  });

  it("splits the address into groups of four without losing characters", () => {
    const address = "0xCB749C6c94c4fEa3c2f7e67A49a4D981480885A9";
    const groups = walletAddressGroups(address);
    expect(groups.join("")).toBe(address);
    expect(groups.every((group, i) => group.length === 4 || i === groups.length - 1)).toBe(true);
  });
});
