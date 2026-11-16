import { describe, expect, it } from "vitest";
import {
  EMPTY_BODY_SHA256,
  SIGNATURE_TEST_VECTOR,
  sha256Hex,
  signMorapayRequest,
} from "@/lib/morapay/sign";

describe("Morapay merchant HMAC", () => {
  it("hashes empty body with docs constant", () => {
    expect(sha256Hex("")).toBe(EMPTY_BODY_SHA256);
  });

  it("matches fixed authentication test vector", () => {
    expect(sha256Hex(SIGNATURE_TEST_VECTOR.rawBody)).toBe(
      SIGNATURE_TEST_VECTOR.expectedBodyHash,
    );
    const headers = signMorapayRequest({
      publicKey: SIGNATURE_TEST_VECTOR.publicKey,
      secret: SIGNATURE_TEST_VECTOR.secret,
      method: SIGNATURE_TEST_VECTOR.method,
      pathWithQuery: SIGNATURE_TEST_VECTOR.pathWithQuery,
      rawBody: SIGNATURE_TEST_VECTOR.rawBody,
      timestamp: SIGNATURE_TEST_VECTOR.timestamp,
    });
    expect(headers["Morapay-Signature"]).toBe(
      SIGNATURE_TEST_VECTOR.expectedSignature,
    );
    expect(headers["Morapay-Key"]).toBe(SIGNATURE_TEST_VECTOR.publicKey);
    expect(headers["Morapay-Timestamp"]).toBe(SIGNATURE_TEST_VECTOR.timestamp);
  });

  it("includes path query string in the signed path", () => {
    const headers = signMorapayRequest({
      publicKey: "pk_test_x",
      secret: "sk_test_x",
      method: "GET",
      pathWithQuery: "/api/v1/merchant/ramp/limits?currency=ghs",
      rawBody: "",
    });
    expect(headers["Morapay-Signature"]).toMatch(/^v1=[a-f0-9]{64}$/);
  });
});