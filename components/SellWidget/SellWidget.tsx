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
import { saveOrderCancel } from "@/lib/order-cancel-copy";
import { shopTokens } from "@/lib/shop-tokens";
import { TokenPicker } from "@/components/TokenPicker";
import { ComingSoonNote } from "@/components/ComingSoonNote";

const CURRENCIES = shopCurrencies(shopConfig);
/** Tokens this shop sells, primary first (core availability is checked on load). */
const SELL_TOKENS = shopTokens(shopConfig).filter((t) => t.sellEnabled || t.comingSoon);
const FIRST_SELLABLE = SELL_TOKENS.find((t) => !t.comingSoon) ?? SELL_TOKENS[0];
const DEFAULT_CURRENCY =
  shopConfig.countries.list.find((c) => c.code === shopConfig.countries.default)?.currency.toUpperCase() ??
  CURRENCIES[0];

/**
 * Sell flow — only mounted when config.sell.enabled.
 * Deposit address must never equal the token contract.
 */
export function SellWidget() {
  const [ticker, setTicker] = useState(FIRST_SELLABLE?.ticker ?? shopConfig.token.ticker);
  /** Extra tokens core is not offering for sale right now; null until the config loads. */
  const [offered, setOffered] = useState<string[] | null>(null);
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
  const pickerTokens = SELL_TOKENS.filter((t) => t.comingSoon || t.primary || offered?.includes(t.ticker));
  const sellable = pickerTokens.filter((t) => !t.comingSoon);
  // A coming-soon token can be picked for a price; the sell itself stays closed.
  const token = pickerTokens.find((t) => t.ticker === ticker) ?? sellable[0] ?? FIRST_SELLABLE ?? SELL_TOKENS[0]!;
  const quoteOnly = token.comingSoon;
  const chain = getChain(token.chainId);
  const spec = chainKindSpec(chain);
  const tagRequired = spec.depositReference === "destination_tag";
  const memoRequired = spec.depositReference === "memo";
  const nameRequired = needsAccountName(currency);
  const { check, retry } = useAccountName(currency, bankCode, account);
  const accountVerified = check.state === "off" || check.state === "ok";

  const amountError = amount ? sellAmountError(amount, shopConfig, token) : null;
  const institution = institutions.find((i) => i.code === bankCode);

  useEffect(() => {
    let active = true;
    void fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        setAvailable(j.success === true && j.data.fallback !== true);
        const tokens = (j.success ? j.data.tokens ?? [] : []) as Array<{ ticker: string; sell?: boolean }>;
        setOffered(tokens.filter((t) => t.sell).map((t) => t.ticker));
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
      if (!available || !amount || sellAmountError(amount, shopConfig, token)) return;
      void fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "OFFRAMP", inputAmount: amount, inputCurrency: currency, token: token.ticker }),
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
    // token: ticker and its range are what the quote depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, available, token.ticker]);

  /** Another token can sit on another kind of chain: its sending wallet and quote never carry over. */
  function changeToken(next: string) {
    if (next === token.ticker) return;
    setTicker(next);
    setWallet("");
    setPayout(null);
    setQuoteError(null);
    setError(null);
  }

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
    if (quoteOnly || !accountVerified) return;
    const v = validateWalletAddress(
      wallet,
      token.chainId,
      token.contract,
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
          token: token.ticker,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message);
        return;
      }
      if (
        j.data.depositAddress?.toLowerCase() ===
        token.contract.toLowerCase()
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
          `Missing deposit destination tag. Do not send ${token.ticker} — contact support with your order reference.`,
        );
        return;
      }
      if (memoRequired && !j.data.depositMemo) {
        setError(
          `Missing deposit memo. Do not send ${token.ticker}. Contact support.`,
        );
        return;
      }
      saveOrderCancel(j.data.ref, j.data.cancelToken, "sell");
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
      <SellTracker orderRef={deposit.ref} ticker={token.ticker}>
        <MemoDepositInstructions
          ticker={token.ticker}
          networkName={chain?.name ?? token.name}
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
            Missing deposit destination tag. Do not send {token.ticker} —
            contact support with ref {deposit.ref}.
          </p>
        </div>
      );
    }
    return (
      <SellTracker orderRef={deposit.ref} ticker={token.ticker}>
        <AddressDepositInstructions
          ticker={token.ticker}
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
      <TokenPicker id="sell-token" tokens={pickerTokens} value={token.ticker} onChange={changeToken} disabled={loading} />
      <div>
        <label htmlFor="sell-amount" className="label">
          {token.ticker} to sell
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
              : token.sellMinToken != null
                ? `Minimum ${token.sellMinToken} ${token.ticker}`
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
      {quoteOnly && <ComingSoonNote ticker={token.ticker} />}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={
          quoteOnly || loading || !payout || !bankCode || !account || !accountVerified || !wallet
        }
        onClick={() => void submit()}
      >
        {loading ? "Starting…" : "Continue"}
      </button>
    </div>
  );
}
