import { afterEach, describe, expect, it } from "vitest";
import { getMerchantConfigStatus } from "@/lib/morapay/merchant-config";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("merchant config", () => {
  it("rejects missing keys", () => {
    delete process.env.MORAPAY_MERCHANT_PUBLIC_KEY;
    delete process.env.MORAPAY_MERCHANT_SECRET_KEY;
    const status = getMerchantConfigStatus();
    expect(status.ready).toBe(false);
    if (!status.ready) expect(status.reason).toBe("missing_merchant_keys");
  });

  it("accepts matching test keys", () => {
    process.env.MORAPAY_MERCHANT_PUBLIC_KEY = "pk_test_abc";
    process.env.MORAPAY_MERCHANT_SECRET_KEY = "sk_test_xyz";
    process.env.MORAPAY_ENV = "test";
    const status = getMerchantConfigStatus();
    expect(status.ready).toBe(true);
  });
});