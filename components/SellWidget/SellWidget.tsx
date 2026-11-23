"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { shopConfig } from "@/shop.config";
import { validateWalletAddress } from "@/lib/validate/address";
import { getChain } from "@/config/chains";
import {
  institutionLabel,
  keepInstitution,
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
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chain = getChain(shopConfig.token.chainId);
  const isXrpl = chain?.kind === "xrpl";

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

  async function submit() {
    setError(null);
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
        isXrpl &&
        (j.data.depositDestinationTag == null ||
          String(j.data.depositDestinationTag).trim() === "")
      ) {
        setError(
          "Missing deposit destination tag. Do not send XRP — contact support with your order reference.",
        );
        return;
      }
      setDeposit({
        ref: j.data.ref,
        depositAddress: j.data.depositAddress,
        depositDestinationTag: j.data.depositDestinationTag,
      });
    } catch {
      setError("Could not start sell order.");
    } finally {
      setLoading(false);
    }
  }

  const tagRequired = isXrpl;

  if (deposit) {
    if (tagRequired && deposit.depositDestinationTag == null) {
      return (
        <div className="card p-5 space-y-4" role="alert">
          <p className="text-sm text-[var(--mp-warning-text)]">
            Missing deposit destination tag. Do not send XRP — contact support
            with ref {deposit.ref}.
          </p>
        </div>
      );
    }
    const qrValue =
      tagRequired && deposit.depositDestinationTag != null
        ? `${deposit.depositAddress}?dt=${deposit.depositDestinationTag}`
        : deposit.depositAddress;

    return (
      <div className="card p-5 space-y-4">
        <h2 className="font-heading text-xl font-bold">Send tokens</h2>
        <p className="text-sm text-[var(--mp-text-muted)]">
          Send exactly {amount} {shopConfig.token.ticker} to the address below
          now. Orders with no deposit are cancelled.
        </p>
        {tagRequired && (
          <div
            className="rounded-2xl border-2 border-[var(--mp-warning-text)] bg-[var(--mp-warning-bg)] p-4 text-sm"
            role="alert"
          >
            <p className="font-semibold text-[var(--mp-warning-text)]">
              Include the destination tag
            </p>
            <p className="mt-1">
              You must send with destination tag{" "}
              <span className="font-mono font-bold">
                {String(deposit.depositDestinationTag)}
              </span>
              . Sending without this tag can mean lost funds.
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <QRCodeSVG value={qrValue} size={160} />
        </div>
        <div className="space-y-2">
          <p className="label mb-0">Deposit address</p>
          <p className="font-mono text-xs break-all subcard p-3">
            {deposit.depositAddress}
          </p>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() =>
              void navigator.clipboard.writeText(deposit.depositAddress)
            }
          >
            Copy address
          </button>
        </div>
        {deposit.depositDestinationTag != null &&
        deposit.depositDestinationTag !== "" ? (
          <div className="space-y-2">
            <p className="label mb-0">Destination tag</p>
            <p className="font-mono text-lg font-bold subcard p-3 text-center">
              {String(deposit.depositDestinationTag)}
            </p>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() =>
                void navigator.clipboard.writeText(
                  String(deposit.depositDestinationTag),
                )
              }
            >
              Copy destination tag
            </button>
          </div>
        ) : null}
        <p className="text-xs font-mono text-[var(--mp-text-muted)]">
          Ref {deposit.ref}
        </p>
      </div>
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
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sell-bank" className="label">
          Network or bank
        </label>
        <select
          id="sell-bank"
          className="field"
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
        >
          <option value="">Choose one</option>
          {institutions.map((i) => (
            <option key={i.code} value={i.code}>
              {institutionLabel(i)}
            </option>
          ))}
        </select>
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
          onChange={(e) => setAccount(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="sell-wallet" className="label">
          Your sending wallet
        </label>
        <input
          id="sell-wallet"
          className="field font-mono text-sm"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder={isXrpl ? "r… or X-address" : undefined}
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
        disabled={loading || !payout || !bankCode || !account || !wallet}
        onClick={() => void submit()}
      >
        {loading ? "Starting…" : "Continue"}
      </button>
    </div>
  );
}