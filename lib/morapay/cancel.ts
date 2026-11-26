import { randomUUID } from "node:crypto";
import { morapayBuyerIpHeaders } from "./buyer-ip";
import { MorapayApiError } from "./client";
import { requireMerchantCredentials } from "./merchant-config";
import { signMorapayRequest } from "./sign";

export type MerchantCancelResult =
  | { ok: true; direction: "buy" | "sell" }
  | { ok: false; status: 404 | 409; message: string; code?: string };

type V2Error = { error?: { code?: string; message?: string; details?: Array<{ code?: string; message?: string }> } };

function baseUrl(): string {
  return process.env.MORAPAY_API_BASE?.replace(/\/$/, "") || "https://api.morapay.io";
}

/** One signed v2 merchant cancel call. A fresh Idempotency-Key each time: Core's cancel is itself idempotent. */
async function postCancel(path: string, buyerIp: string): Promise<{ status: number; json: unknown }> {
  const { publicKey, secretKey } = requireMerchantCredentials();
  const signed = signMorapayRequest({ publicKey, secret: secretKey, method: "POST", pathWithQuery: path, rawBody: "" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Idempotency-Key": `shop-cancel-${randomUUID()}`,
        ...signed,
        ...morapayBuyerIpHeaders(buyerIp),
      },
      signal: controller.signal,
      cache: "no-store",
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new MorapayApiError({ code: "network.timeout", message: "The request timed out. Please try again.", status: 504 });
    }
    throw new MorapayApiError({ message: "Could not reach the payment service.", status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

function refusal(json: unknown): { message: string; code?: string } {
  const error = (json as V2Error | null)?.error;
  const issue = error?.details?.find((d) => typeof d?.message === "string" && d.message.trim());
  return {
    message: issue?.message?.trim() || "This order can't be cancelled",
    code: issue?.code ?? error?.code,
  };
}

/**
 * Cancel an unpaid order through Core's merchant v2 cancel (POST /v2/buys/{ref}/cancel, then
 * /v2/sells/{ref}/cancel when it is not a buy). Core checks the provider and the deposit wallet.
 */
export async function cancelMerchantOrder(ref: string, ctx: { buyerIp?: string } = {}): Promise<MerchantCancelResult> {
  const encoded = encodeURIComponent(ref);
  for (const direction of ["buy", "sell"] as const) {
    const { status, json } = await postCancel(`/v2/${direction}s/${encoded}/cancel`, ctx.buyerIp ?? "");
    if (status >= 200 && status < 300) return { ok: true, direction };
    if (status === 404) continue;
    if (status === 409) return { ok: false, status: 409, ...refusal(json) };
    const error = (json as V2Error | null)?.error;
    throw new MorapayApiError({
      code: error?.code,
      message: status === 429 ? "Too many requests. Try again shortly." : "Couldn't cancel. Try again shortly.",
      status: status >= 500 ? 502 : status,
    });
  }
  return { ok: false, status: 404, message: "Order not found" };
}
