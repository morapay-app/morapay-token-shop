"use client";

import { useEffect, useRef, useState } from "react";
import { shopConfig } from "@/shop.config";
import { validateWalletAddress } from "@/lib/validate/address";
import { getChain } from "@/config/chains";
import { chainKindSpec } from "@/config/chain-kinds";
import { AccountName } from "./AccountName";
import { AddressDepositInstructions } from "./AddressDepositInstructions";
import { InstitutionPicker } from "./InstitutionPicker";
import { SellTracker } from "./SellTracker";
import { MemoDepositInstructions } from "./MemoDepositInstructions";
import { useAccountName } from "./useAccountName";
import {
  keepInstitution,
  needsAccountName,
  NUBAN_LENGTH,
  sellAmountError,
  shopCurrencies,
  sortInstitutions,
  type SellInstitution,
} from "@/lib/sell";

const CURRENCIES = shopCurrencies(shopConfig);
const DEFAULT_CURRENCY =
  shopConfig.countries.list.find((c) => c.code === shopConfig.countries.default)?.currency.toUpperCase() ??
  CURRENCIES[0];

/**
 * Sell flow — only mounted when config.sell.enabled.
 * Deposit address must never equal the token contract.
 */
export function SellWidget() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [wallet, setWallet] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [institutions, setInstitutions] = useState<SellInstitution[]>([]);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [payout, setPayout] = useState<{ amount: string; currency: string } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteReq = useRef(0);
  const [account, setAccount] = useState("");
  const [deposit, setDeposit] = useState<{
    ref: string;
    depositAddress: string;
    depositDestinationTag?: string | number;
    depositMemo?: string;
    depositAmount?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chain = getChain(shopConfig.token.chainId);
  const spec = chainKindSpec(chain);
  const tagRequired = spec.depositReference === "destination_tag";
  const memoRequired = spec.depositReference === "memo";
  const nameRequired = needsAccountName(currency);
  const { check, retry } = useAccountName(currency, bankCode, account);
  const accountVerified = check.state === "off" || check.state === "ok";

  const amountError = amount ? sellAmountError(amount, shopConfig) : null;
  const institution = institutions.find((i) => i.code === bankCode);

  useEffect(() => {
    let active = true;
    void fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (active) setAvailable(j.success === true && j.data.fallback !== true);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch(`/api/institutions?currency=${currency.toLowerCase()}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        const list = j.success ? sortInstitutions(j.data.institutions ?? []) : [];
        setInstitutions(list);
        setBankCode((current) => keepInstitution(current, list));
        setInstitutionsError(list.length === 0 ? "Payout options could not be loaded." : null);
      })
      .catch(() => {
        if (!active) return;
        setInstitutions([]);
        setBankCode("");
        setInstitutionsError("Payout options could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [currency]);

  useEffect(() => {
    const reqId = ++quoteReq.current;
    const timer = setTimeout(() => {
      setPayout(null);
      setQuoteError(null);
      if (!available || !amount || sellAmountError(amount, shopConfig)) return;
      void fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "OFFRAMP", inputAmount: amount, inputCurrency: currency }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (reqId !== quoteReq.current) return;
          if (j.success) setPayout({ amount: j.data.output.amount, currency: j.data.output.currency });
          else setQuoteError(j.message ?? "No quote right now.");
        })
        .catch(() => {
          if (reqId === quoteReq.current) setQuoteError("No quote right now.");
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [amount, currency, available]);

  /** A bank or number from one currency must never carry over to another. */
  function changeCurrency(next: string) {
    if (next === currency) return;
    setCurrency(next);
    setInstitutions([]);
    setBankCode("");
    setAccount("");
  }

  async function submit() {
    setError(null);
    if (!accountVerified) return;
    const v = validateWalletAddress(
      wallet,
      shopConfig.token.chainId,
      shopConfig.token.contract,
    );
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAmount: amount,
          currency,
          walletAddress: v.normalized,
          bankCode,
          accountNumber: account,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message);
        return;
      }
      if (
        j.data.depositAddress?.toLowerCase() ===
        shopConfig.token.contract.toLowerCase()
      ) {
        setError("Unsafe deposit address. Do not send tokens.");
        return;
      }
      if (
        tagRequired &&
        (j.data.depositDestinationTag == null ||
          String(j.data.depositDestinationTag).trim() === "")
      ) {
        setError(
          `Missing deposit destination tag. Do not send ${shopConfig.token.ticker} — contact support with your order reference.`,
        );
        return;
      }
      if (memoRequired && !j.data.depositMemo) {
        setError(
          `Missing deposit memo. Do not send ${shopConfig.token.ticker}. Contact support.`,
        );
        return;
      }
      setDeposit({
        ref: j.data.ref,
        depositAddress: j.data.depositAddress,
        depositDestinationTag: j.data.depositDestinationTag,
        depositMemo: j.data.depositMemo,
        depositAmount: j.data.depositAmount,
      });
    } catch {
      setError("Could not start sell order.");
    } finally {
      setLoading(false);
    }
  }

  if (deposit && memoRequired && deposit.depositMemo) {
    return (
      <SellTracker orderRef={deposit.ref} ticker={shopConfig.token.ticker}>
        <MemoDepositInstructions
          ticker={shopConfig.token.ticker}
          networkName={chain?.name ?? shopConfig.token.name}
          depositAddress={deposit.depositAddress}
          depositMemo={deposit.depositMemo}
          depositAmount={deposit.depositAmount ?? amount}
          orderRef={deposit.ref}
        />
      </SellTracker>
    );
  }

  if (deposit) {
    if (tagRequired && deposit.depositDestinationTag == null) {
      return (
        <div className="card p-5 space-y-4" role="alert">
          <p className="text-sm text-[var(--mp-warning-text)]">
            Missing deposit destination tag. Do not send {shopConfig.token.ticker} —
            contact support with ref {deposit.ref}.
          </p>
        </div>
      );
    }
    return (
      <SellTracker orderRef={deposit.ref} ticker={shopConfig.token.ticker}>
        <AddressDepositInstructions
          ticker={shopConfig.token.ticker}
          amount={amount}
          depositAddress={deposit.depositAddress}
          destinationTag={deposit.depositDestinationTag}
          tagRequired={tagRequired}
        />
      </SellTracker>
    );
  }

  if (available === false) {
    return (
      <div className="card p-5" role="status">
        <p className="text-sm text-[var(--mp-warning-text)]">
          Selling is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <label htmlFor="sell-amount" className="label">
          {shopConfig.token.ticker} to sell
        </label>
        <input
          id="sell-amount"
          className="field font-numbers text-2xl"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          aria-describedby="sell-hint"
        />
        <p id="sell-hint" className="mt-2 text-sm text-[var(--mp-text-muted)]">
          {amountError ??
            quoteError ??
            (payout
              ? `You receive about ${payout.amount} ${payout.currency}`
              : shopConfig.sell.minToken != null
                ? `Minimum ${shopConfig.sell.minToken} ${shopConfig.token.ticker}`
                : null)}
        </p>
      </div>
      <div>
        <label htmlFor="sell-currency" className="label">
          Payout currency
        </label>
        <select
          id="sell-currency"
          className="field"
          value={currency}
          onChange={(e) => changeCurrency(e.target.value)}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <InstitutionPicker
          id="sell-bank"
          label={nameRequired ? "Bank" : "Network or bank"}
          institutions={institutions}
          value={bankCode}
          onChange={setBankCode}
        />
        {institutionsError && (
          <p className="mt-2 text-sm text-[var(--mp-warning-text)]" role="alert">
            {institutionsError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="sell-account" className="label">
          {institution?.kind === "mobile_money" ? "Mobile money number" : "Account number"}
        </label>
        <input
          id="sell-account"
          className="field"
          value={account}
          inputMode={nameRequired ? "numeric" : undefined}
          aria-describedby={nameRequired ? "sell-account-name" : undefined}
          onChange={(e) =>
            setAccount(
              nameRequired
                ? e.target.value.replace(/\D/g, "").slice(0, NUBAN_LENGTH)
                : e.target.value,
            )
          }
        />
        {nameRequired && <AccountName check={check} onRetry={retry} />}
      </div>
      <div>
        <label htmlFor="sell-wallet" className="label">
          {spec.wallet.sellLabel}
        </label>
        <input
          id="sell-wallet"
          className="field font-mono text-sm"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder={spec.wallet.sellPlaceholder}
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--mp-warning-text)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={
          loading || !payout || !bankCode || !account || !accountVerified || !wallet
        }
        onClick={() => void submit()}
      >
        {loading ? "Starting…" : "Continue"}
      </button>
    </div>
  );
}
