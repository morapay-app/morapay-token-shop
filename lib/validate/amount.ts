import { z } from "zod";

export const INVALID_AMOUNT_MESSAGE = "Amount must be a positive number";

/** Plain positive decimal text: no sign, exponent, hex, spaces or zero ("0", "0.00"). */
export function isPositiveAmountString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && /^\d+(\.\d+)?$/.test(value) && /[1-9]/.test(value);
}

export const zPositiveAmount = z.string().refine(isPositiveAmountString, INVALID_AMOUNT_MESSAGE);

/** A bad body is the caller's mistake: 400 with one terse line, never a 502. */
export function bodyIssue(error: z.ZodError): { code: string; message: string } {
  const amountIssue = error.issues.some((issue) => issue.message === INVALID_AMOUNT_MESSAGE);
  return amountIssue
    ? { code: "invalid_amount", message: INVALID_AMOUNT_MESSAGE }
    : { code: "invalid_request", message: "Invalid request." };
}
