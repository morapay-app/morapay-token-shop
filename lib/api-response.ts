import { NextResponse } from "next/server";
import { toClientError } from "@/lib/morapay/client";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonErr(err: unknown, status = 400) {
  const mapped = toClientError(err);
  const codeStatus =
    typeof err === "object" &&
    err &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : status;

  const headers = new Headers();
  if (mapped.retryAfterSec) {
    headers.set("Retry-After", String(mapped.retryAfterSec));
  }

  return NextResponse.json(
    {
      success: false,
      code: mapped.code,
      message: mapped.message,
      requestId: mapped.requestId,
      retryAfterSec: mapped.retryAfterSec,
    },
    { status: mapped.retryAfterSec ? 429 : codeStatus, headers },
  );
}
