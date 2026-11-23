import { describe, expect, it } from "vitest";
import {
  resolvePayoutDestinationTag,
  validateDestinationTag,
} from "@/lib/validate/destination-tag";

describe("destination tag validation", () => {
  it("allows empty optional tag", () => {
    expect(validateDestinationTag("").ok).toBe(true);
    expect(validateDestinationTag(undefined).ok).toBe(true);
    const empty = validateDestinationTag("");
    if (empty.ok) expect(empty.value).toBeUndefined();
  });

  it("accepts uint32 values", () => {
    const r = validateDestinationTag("123456");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(123456);
    expect(validateDestinationTag("4294967295").ok).toBe(true);
  });

  it("resolvePayoutDestinationTag merges embedded tag", () => {
    const r = resolvePayoutDestinationTag("", 4242);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(4242);
  });

  it("resolvePayoutDestinationTag rejects mismatch", () => {
    const r = resolvePayoutDestinationTag("1", 4242);
    expect(r.ok).toBe(false);
  });

  it("rejects non-numeric and out-of-range", () => {
    expect(validateDestinationTag("12.5").ok).toBe(false);
    expect(validateDestinationTag("4294967296").ok).toBe(false);
    expect(validateDestinationTag("-1").ok).toBe(false);
  });
});