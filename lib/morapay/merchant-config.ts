export type MorapayMerchantCredentials = {
  publicKey: string;
  secretKey: string;
  env: "test" | "live";
};

export type MerchantConfigStatus =
  | { ready: true; credentials: MorapayMerchantCredentials }
  | { ready: false; reason: string };

function keyEnv(prefix: "pk" | "sk", key: string): "test" | "live" | null {
  if (key.startsWith(`${prefix}_test_`)) return "test";
  if (key.startsWith(`${prefix}_live_`)) return "live";
  return null;
}

/** Server-only Morapay merchant keys (never NEXT_PUBLIC_). */
export function getMerchantConfigStatus(): MerchantConfigStatus {
  const publicKey = process.env.MORAPAY_MERCHANT_PUBLIC_KEY?.trim() ?? "";
  const secretKey = process.env.MORAPAY_MERCHANT_SECRET_KEY?.trim() ?? "";

  if (!publicKey || !secretKey) {
    return {
      ready: false,
      reason: "missing_merchant_keys",
    };
  }

  const pubEnv = keyEnv("pk", publicKey);
  const skEnv = keyEnv("sk", secretKey);
  if (!pubEnv || !skEnv) {
    return {
      ready: false,
      reason: "invalid_key_prefix",
    };
  }
  if (pubEnv !== skEnv) {
    return {
      ready: false,
      reason: "key_env_mismatch",
    };
  }

  const declared = (process.env.MORAPAY_ENV?.trim().toLowerCase() ??
    pubEnv) as "test" | "live";
  if (declared !== "test" && declared !== "live") {
    return { ready: false, reason: "invalid_morapay_env" };
  }
  if (declared !== pubEnv) {
    return { ready: false, reason: "morapay_env_key_mismatch" };
  }

  return {
    ready: true,
    credentials: { publicKey, secretKey, env: pubEnv },
  };
}

export function merchantSigningEnabled(): boolean {
  return getMerchantConfigStatus().ready;
}

export function requireMerchantCredentials(): MorapayMerchantCredentials {
  const status = getMerchantConfigStatus();
  if (!status.ready) {
    throw new Error(
      `Morapay merchant keys are not configured (${status.reason}). ` +
        "Set MORAPAY_MERCHANT_PUBLIC_KEY and MORAPAY_MERCHANT_SECRET_KEY.",
    );
  }
  return status.credentials;
}