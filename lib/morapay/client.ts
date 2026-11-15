import { z } from "zod";

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

export function mapEnvelopeError(
  envelope: z.infer<typeof EnvelopeSchema>,
  status: number,
): MorapayError {
  return {
    code: envelope.code,
    message:
      envelope.displayMessage ||
      envelope.safeMessage ||
      "Something went wrong. Please try again.",
    requestId: envelope.requestId,
    retryAfterSec: envelope.retryAfterSec,
    status,
  };
}

export type FetchOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Default 20s; money steps use 60s. */
  timeoutMs?: number;
  searchParams?: Record<string, string | undefined>;
};

function baseUrl(): string {
  return (
    process.env.MORAPAY_API_BASE?.replace(/\/$/, "") ||
    "https://api.morapay.io"
  );
}

export async function morapayFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const url = new URL(path.startsWith("http") ? path : `${baseUrl()}${path}`);
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: options.body != null ? JSON.stringify(options.body) : undefined,
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
  if (err instanceof MorapayApiError) {
    return {
      code: err.code,
      message: err.message,
      requestId: err.requestId,
      retryAfterSec: err.retryAfterSec,
    };
  }
  return { message: "Something went wrong. Please try again." };
}
