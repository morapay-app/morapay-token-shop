"use client";

import { useCallback, useEffect, useState } from "react";
import { isNuban, needsAccountName } from "@/lib/sell";

export type AccountNameCheck =
  /** No check for this currency. */
  | { state: "off" }
  | { state: "incomplete" }
  | { state: "checking" }
  | { state: "ok"; name: string }
  | { state: "failed"; message: string };

type Result = { key: string; name?: string; message?: string };

const FAILED = "Name check is unavailable. Try again.";

/**
 * Looks up the account holder once a bank and full account number are in. A result only counts
 * for the exact bank + number it was fetched for, so editing either drops it at once.
 */
export function useAccountName(currency: string, bankCode: string, account: string) {
  const needed = needsAccountName(currency);
  const complete = needed && bankCode !== "" && isNuban(account);
  const key = `${bankCode}:${account}`;
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!complete) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/institutions/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankCode, accountNumber: account }),
          signal: controller.signal,
        });
        const j = await res.json();
        const name = j.success ? String(j.data.accountName ?? "").trim() : "";
        if (controller.signal.aborted) return;
        setResult(name ? { key, name } : { key, message: j.message ?? FAILED });
      } catch {
        if (!controller.signal.aborted) setResult({ key, message: FAILED });
      }
    })();
    return () => controller.abort();
  }, [complete, bankCode, account, key, attempt]);

  const retry = useCallback(() => {
    setResult(null);
    setAttempt((n) => n + 1);
  }, []);

  let check: AccountNameCheck;
  if (!needed) check = { state: "off" };
  else if (!complete) check = { state: "incomplete" };
  else if (result?.key !== key) check = { state: "checking" };
  else if (result.name) check = { state: "ok", name: result.name };
  else check = { state: "failed", message: result.message ?? FAILED };

  return { check, retry };
}
