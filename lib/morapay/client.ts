import { z } from "zod";
import { signMorapayRequest } from "./sign";
import {
  getMerchantConfigStatus,
  requireMerchantCredentials,
} from "./merchant-config";
import { morapayBuyerIpHeaders } from "./buyer-ip";

export const EnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  code: z.string().optional(),
  safeMessage: z.string().optional(),
  displayMessage: z.string().optional(),
  why: z.string().optional(),
  howToFix: z.string().optional(),
  docUrl: z.string().optional(),
  requestId: z.string().optional(),
  retryAfterSec: z.number().optional(),
});

export type MorapayError = {
  code?: string;
  message: string;
  requestId?: string;
  retryAfterSec?: number;
  status: number;
};

export class MorapayApiError extends Error {
  readonly code?: string;
  readonly requestId?: string;
  readonly retryAfterSec?: number;
  readonly status: number;

  constructor(err: MorapayError) {
    super(err.message);
    this.name = "MorapayApiError";
    this.code = err.code;
    this.requestId = err.requestId;
    this.retryAfterSec = err.retryAfterSec;
    this.status = err.status;
  }
}

function morapayErrorRecord(err: unknown): MorapayError | null {
  if (typeof err !== "object" || err === null) return null;
  const e = err as Record<string, unknown>;
  if (typeof e.message !== "string") return null;
  if (typeof e.status !== "number") return null;
  return {
    code: typeof e.code === "string" ? e.code : undefined,
    message: e.message,
    requestId: typeof e.requestId === "string" ? e.requestId : undefined,
    retryAfterSec:
      typeof e.retryAfterSec === "number" ? e.retryAfterSec : undefined,
    status: e.status,
  };
}

/** Cross-bundle safe: production may load two copies of MorapayApiError. */
export function isMorapayApiError(err: unknown): boolean {
  if (err instanceof MorapayApiError) return true;
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  if (e.name === "MorapayApiError") return morapayErrorRecord(err) != null;
  return (
    typeof e.code === "string" &&
    typeof e.message === "string" &&
    typeof e.status === "number"
  );
}

export function asMorapayApiError(err: unknown): MorapayError | null {
  if (!isMorapayApiError(err)) return null;
  if (err instanceof MorapayApiError) {
    return {
      code: err.code,
      message: err.message,
      requestId: err.requestId,
      retryAfterSec: err.retryAfterSec,
      status: err.status,
    };
  }
  return morapayErrorRecord(err);
}

export function mapEnvelopeError(
  envelope: z.infer<typeof EnvelopeSchema>,
  status: number,
): MorapayError {
  const code = envelope.code;
  const display = envelope.displayMessage || envelope.safeMessage;
  const belowMin =
    code === "ramp.limit" ||
    (code &&
      /(?:^|[._-])(?:min(?:imum)?|too_?low|too_?small|below_?min)/i.test(
        code,
      )) ||
    (display != null &&
      /below\s+(?:the\s+)?minimum|minimum\s+(?:buy|order|amount|fiat)|amount\s+is\s+too\s+(?:low|small)/i.test(
        display,
      ));

  const message = belowMin
    ? envelope.howToFix ||
      display ||
      "Amount is below the minimum for this payment method."
    : display || "Something went wrong. Please try again.";

  return {
    code,
    message,
    requestId: envelope.requestId,
    retryAfterSec: envelope.retryAfterSec,
    status,
  };
}

export type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Pre-serialized body (use when stable signing bytes matter). */
  rawBody?: string;
  timeoutMs?: number;
  searchParams?: Record<string, string | undefined>;
  /** Shopper IP for ramp abuse attribution (never the deployment egress IP alone). */
  buyerIp?: string;
  /** When false, skip merchant signing (public fallback only; off by default). */
  requireSigning?: boolean;
};

function baseUrl(): string {
  return (
    process.env.MORAPAY_API_BASE?.replace(/\/$/, "") ||
    "https://api.morapay.io"
  );
}

function buildPath(path: string, searchParams?: FetchOptions["searchParams"]) {
  const pathOnly = path.startsWith("http")
    ? new URL(path).pathname + new URL(path).search
    : path;
  if (!searchParams) {
    return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  return q ? `${normalized}?${q}` : normalized;
}

function allowPublicFallback(): boolean {
  return process.env.MORAPAY_ALLOW_PUBLIC_FALLBACK === "true";
}

/** Legacy unsigned Morapay routes — only when MORAPAY_ALLOW_PUBLIC_FALLBACK=true. */
export function toPublicApiPath(pathWithQuery: string): string {
  const [path, query] = pathWithQuery.split("?");
  let mapped = path;
  if (mapped.startsWith("/api/v1/merchant/ramp")) {
    mapped = mapped.replace("/api/v1/merchant/ramp", "/api/public/ramp");
  } else if (mapped === "/api/v1/quotes/checkout") {
    mapped = "/api/public/quotes";
  } else if (mapped.startsWith("/api/v1/merchant")) {
    mapped = mapped.replace("/api/v1/merchant", "/api/public");
  }
  return query ? `${mapped}?${query}` : mapped;
}

/**
 * Signed Morapay API fetch. All token-shop routes use merchant (or signed v1) paths.
 */
export async function morapayFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const method = options.method ?? (options.body != null ? "POST" : "GET");
  const pathWithQuery = buildPath(path, options.searchParams);
  const url = path.startsWith("http")
    ? path
    : `${baseUrl()}${pathWithQuery}`;

  const rawBody =
    options.rawBody ??
    (options.body != null ? JSON.stringify(options.body) : "");

  const merchantReady = getMerchantConfigStatus().ready;
  const useSigning = options.requireSigning !== false && merchantReady;

  if (!useSigning) {
    if (!allowPublicFallback() && options.requireSigning !== false) {
      throw new MorapayApiError({
        code: "merchant.keys.missing",
        message:
          "Morapay merchant API keys are not configured on this shop server.",
        status: 503,
      });
    }
    const publicPath = toPublicApiPath(pathWithQuery);
    const publicUrl = `${baseUrl()}${publicPath}`;
  let fallbackBody = rawBody;
  if (
    pathWithQuery.startsWith("/api/v1/quotes/checkout") &&
    rawBody
  ) {
    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      fallbackBody = JSON.stringify({
        action: "ONRAMP",
        inputAmount: parsed.inputAmount,
        inputCurrency: String(parsed.inputCurrency ?? "").toUpperCase(),
        outputCurrency: String(parsed.targetTokenSymbol ?? "").toUpperCase(),
        chain: String(parsed.targetChainId ?? ""),
      });
    } catch {
      /* keep rawBody */
    }
  }

    return executeFetch<T>(publicUrl, {
      method,
      headers: {
        Accept: "application/json",
        ...(fallbackBody ? { "Content-Type": "application/json" } : {}),
        ...morapayBuyerIpHeaders(options.buyerIp ?? ""),
      },
      body: fallbackBody || undefined,
      timeoutMs,
      pathForError: publicPath,
    });
  }

  const { publicKey, secretKey } = requireMerchantCredentials();
  const signPath = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;

  const signed = signMorapayRequest({
    publicKey,
    secret: secretKey,
    method,
    pathWithQuery: signPath,
    rawBody: method === "GET" || method === "DELETE" ? "" : rawBody,
  });

  return executeFetch<T>(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(rawBody ? { "Content-Type": "application/json" } : {}),
      ...signed,
      ...morapayBuyerIpHeaders(options.buyerIp ?? ""),
    },
    body: rawBody || undefined,
    timeoutMs,
    pathForError: signPath,
  });
}

type ExecuteOpts = {
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs: number;
  pathForError: string;
};

async function executeFetch<T>(url: string, opts: ExecuteOpts): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body,
      signal: controller.signal,
      cache: "no-store",
    });

    const retryAfterHeader = res.headers.get("Retry-After");
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new MorapayApiError({
        message: "Invalid response from payment service.",
        status: res.status,
        retryAfterSec: retryAfterHeader ? Number(retryAfterHeader) : undefined,
      });
    }

    const envelope = EnvelopeSchema.safeParse(json);
    if (!envelope.success) {
      throw new MorapayApiError({
        message: "Unexpected response from payment service.",
        status: res.status,
      });
    }

    if (!res.ok || !envelope.data.success) {
      const mapped = mapEnvelopeError(envelope.data, res.status);
      if (!mapped.retryAfterSec && retryAfterHeader) {
        mapped.retryAfterSec = Number(retryAfterHeader);
      }
      throw new MorapayApiError(mapped);
    }

    return envelope.data.data as T;
  } catch (err) {
    if (err instanceof MorapayApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new MorapayApiError({
        code: "network.timeout",
        message: "The request timed out. Please try again.",
        status: 504,
      });
    }
    throw new MorapayApiError({
      message: "Could not reach the payment service.",
      status: 502,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Client-facing error payload (never raw internals). */
export function toClientError(err: unknown): {
  code?: string;
  message: string;
  requestId?: string;
  retryAfterSec?: number;
} {
  const morapay = asMorapayApiError(err);
  if (morapay) {
    return {
      code: morapay.code,
      message: morapay.message,
      requestId: morapay.requestId,
      retryAfterSec: morapay.retryAfterSec,
    };
  }
  // A route's own refusal ({ message, status: 4xx }, e.g. "Phone number is required.") keeps its
  // words. Thrown errors and anything 5xx stay generic so internals never reach the browser.
  if (
    typeof err === "object" &&
    err !== null &&
    !(err instanceof Error) &&
    typeof (err as { message?: unknown }).message === "string" &&
    typeof (err as { status?: unknown }).status === "number" &&
    (err as { status: number }).status >= 400 &&
    (err as { status: number }).status < 500
  ) {
    return { message: (err as { message: string }).message.slice(0, 300) };
  }
  return { message: "Something went wrong. Please try again." };
}