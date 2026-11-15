import { describe, expect, it } from "vitest";
import { parseGhanaPhone } from "@/lib/validate/phone";

describe("Ghana phone parsing", () => {
  it("normalises local, +233 and 233 forms to 0XXXXXXXXX → MTN", () => {
    for (const input of ["0241234567", "+233241234567", "233241234567"]) {
      const r = parseGhanaPhone(input);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.local).toBe("0241234567");
        expect(r.networkHint).toBe("MTN");
      }
    }
  });

  it("maps Telecel and AirtelTigo prefixes", () => {
    const telecel = parseGhanaPhone("0201234567");
    expect(telecel.ok && telecel.networkHint).toBe("Vodafone");
    const at = parseGhanaPhone("0271234567");
    expect(at.ok && at.networkHint).toBe("AirtelTigo");
  });

  it("rejects a too-short number", () => {
    expect(parseGhanaPhone("02412345").ok).toBe(false);
    expect(parseGhanaPhone("02412").ok).toBe(false);
  });
});
