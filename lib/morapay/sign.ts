import { createHash, createHmac } from "node:crypto";

export const EMPTY_BODY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Derive HMAC key: SHA-256 UTF-8 secret as 32 raw bytes (not hex). */
export function merchantSigningKey(secret: string): Buffer {
  return createHash("sha256").update(secret.trim(), "utf8").digest();
}

export type SignMorapayRequestParams = {
  publicKey: string;
  secret: string;
  method: string;
  pathWithQuery: string;
  rawBody?: string;
  timestamp?: string;
};

/**
 * Morapay Merchant API v1 HMAC (docs.morapay.io/getting-started/authentication).
 * Canonical: `{timestamp}.{METHOD}.{pathWithQuery}.{sha256Hex(rawBody)}`
 * Signature header: `v1={hmacSha256Hex}`
 */
export function signMorapayRequest(
  params: SignMorapayRequestParams,
): Record<string, string> {
  const timestamp = params.timestamp ?? String(Math.floor(Date.now() / 1000));
  const rawBody = params.rawBody ?? "";
  const method = params.method.trim().toUpperCase();
  const path = params.pathWithQuery.startsWith("/")
    ? params.pathWithQuery
    : `/${params.pathWithQuery}`;
  const payload = `${timestamp}.${method}.${path}.${sha256Hex(rawBody)}`;
  const digest = createHmac("sha256", merchantSigningKey(params.secret))
    .update(payload, "utf8")
    .digest("hex");

  return {
    "Morapay-Key": params.publicKey.trim(),
    "Morapay-Timestamp": timestamp,
    "Morapay-Signature": `v1=${digest}`,
  };
}

/** Fixed test vector from Morapay authentication docs (for core verifier parity). */
export const SIGNATURE_TEST_VECTOR = {
  publicKey: "pk_test_signature_vector",
  secret: "sk_test_signature_vector",
  method: "POST",
  pathWithQuery: "/api/v1/merchant/links",
  rawBody: '{"title":"Invoice #42","amount":100,"currency":"USD"}',
  timestamp: "1731900000",
  expectedBodyHash:
    "de0a5d6beb02f654df0179dae2d216cb5d63fb26b5bd5d1bf8a9d526e30c2f31",
  expectedSignature:
    "v1=e2a6ad528d7b0378b22efa6bbbe1f84ff04529bf28c6c73b8004d9a46d68209a",
} as const;