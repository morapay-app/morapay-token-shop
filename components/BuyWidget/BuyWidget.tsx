"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { buyReducer, initialBuyState, type QuoteView } from "./machine";
import { AmountStep } from "./AmountStep";
import { PaymentStep } from "./PaymentStep";
import { WalletStep } from "./WalletStep";
import { ReviewStep } from "./ReviewStep";
import { AwaitingStep } from "./AwaitingStep";
import { OtpStep } from "./OtpStep";
import { BankDepositStep } from "./BankDepositStep";
import { StatusStep } from "./StatusStep";
import { TelegramFallback } from "@/components/TelegramFallback";
import { track } from "@/lib/analytics";

type ShopApiConfig = {
  token: {
    name: string;
    ticker: string;
    chainId: number;
    contract: string;
    decimals: number;
  };
  countries: Array<{
    code: string;
    currency: string;
    selectable: boolean;
    quickAmounts?: number[];
    buyLimits?: { minFiat: number; maxFiat: number };
    methods: Array<{
      id: string;
      kind: "mobile_money" | "bank_transfer" | "card";
      label: string;
      selectable: boolean;
      comingSoon: boolean;
      networkProvider?: string;
      phonePrefixes?: string[];
    }>;
  }>;
  defaultCountry: string;
  detectedCountry: string;
  detectedNote?: string;
  fallback: boolean;
  telegram: { deskUrl: string };
  fees: { showFeeLine: boolean; note?: string };
};

function persistOrder(ref: string, wallet: string) {
  try {
    localStorage.setItem("mp_order", JSON.stringify({ ref, wallet }));
  } catch {
    /* ignore */
  }
}

export function BuyWidget() {
  const [config, setConfig] = useState<ShopApiConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(
    buyReducer,
    initialBuyState("GH", "GHS"),
  );
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteReq = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStarted = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const country = params.get("country");
    void fetch(`/api/config${country ? `?country=${country}` : ""}`)
      .then(async (r) => {
        const j = await r.json();
        if (!j.success) throw new Error(j.message ?? "Config failed");
        return j.data as ShopApiConfig;
      })
      .then((data) => {
        setConfig(data);
        const c =
          data.countries.find((x) => x.code === data.detectedCountry) ??
          data.countries.find((x) => x.code === data.defaultCountry)!;
        dispatch({
          type: "HYDRATE",
          payload: {
            country: c.code,
            currency: c.currency,
            fallback: data.fallback,
            step: data.fallback ? "fallback" : "amount",
          },
        });
      })
      .catch((e: Error) => {
        setLoadError(e.message);
        dispatch({ type: "ENABLE_FALLBACK" });
      });
  }, []);

  const activeCountry = config?.countries.find((c) => c.code === state.country);

  const fetchQuote = useCallback(
    async (amount: string, currency: string) => {
      if (!amount || Number(amount) <= 0) {
        quoteReq.current += 1;
        setQuoteLoading(false);
        dispatch({ type: "SET_QUOTE", quote: null });
        return;
      }
      const reqId = ++quoteReq.current;
      setQuoteLoading(true);
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ONRAMP",
            inputAmount: amount,
            inputCurrency: currency,
          }),
        });
        const j = await res.json();
        if (reqId !== quoteReq.current) return;
        if (!j.success) {
          dispatch({ type: "SET_QUOTE", quote: null });
          return;
        }
        const q = j.data;
        const view: QuoteView = {
          quoteId: q.quoteId,
          expiresAt: q.expiresAt,
          exchangeRate: q.exchangeRate,
          inputAmount: q.input.amount,
          inputCurrency: q.input.currency,
          outputAmount: q.output.amount,
          outputCurrency: q.output.currency,
          totalFee: q.fees?.totalFee,
        };
        dispatch({ type: "SET_QUOTE", quote: view });
        track("quote_viewed", { currency });
      } catch {
        if (reqId !== quoteReq.current) return;
        dispatch({ type: "SET_QUOTE", quote: null });
      } finally {
        if (reqId === quoteReq.current) setQuoteLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    if (!state.amount || Number(state.amount) <= 0) {
      quoteReq.current += 1;
      setQuoteLoading(false);
      return;
    }
    setQuoteLoading(true);
    quoteTimer.current = setTimeout(() => {
      void fetchQuote(state.amount, state.currency);
    }, 400);
    return () => {
      if (quoteTimer.current) clearTimeout(quoteTimer.current);
    };
  }, [state.amount, state.currency, fetchQuote]);

  // Refresh quote every 30s or on expiry
  useEffect(() => {
    if (!state.quote) return;
    const expires = Date.parse(state.quote.expiresAt);
    const untilExpiry = Math.max(1_000, expires - Date.now() - 1_000);
    const t = setTimeout(
      () => void fetchQuote(state.amount, state.currency),
      Math.min(untilExpiry, 30_000),
    );
    return () => clearTimeout(t);
  }, [state.quote, state.amount, state.currency, fetchQuote]);

  const pollStatus = useCallback(() => {
    if (!state.ref || !state.wallet) return;
    if (!pollStarted.current) pollStarted.current = Date.now();
    const elapsed = Date.now() - pollStarted.current;
    if (elapsed > 15 * 60_000) {
      dispatch({ type: "GOTO", step: "still_processing" });
      return;
    }
    const interval = elapsed > 2 * 60_000 ? 10_000 : 4_000;

    void fetch(
      `/api/orders/${encodeURIComponent(state.ref)}?wallet_address=${encodeURIComponent(state.wallet)}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        dispatch({
          type: "STATUS",
          phase: j.data.phase,
          txHash: j.data.txHash,
          explorerUrl: j.data.explorerUrl,
          message: j.data.message,
        });
        if (j.data.phase === "completed") track("order_completed", { ref: state.ref! });
        if (j.data.phase === "failed") track("order_failed", { code: "failed" });
      })
      .finally(() => {
        if (
          state.step === "awaiting_prompt" ||
          state.step === "bank_deposit" ||
          state.step === "delivering" ||
          state.step === "otp"
        ) {
          pollTimer.current = setTimeout(pollStatus, interval);
        }
      });
  }, [state.ref, state.wallet, state.step]);

  useEffect(() => {
    if (
      state.step === "awaiting_prompt" ||
      state.step === "bank_deposit" ||
      state.step === "delivering"
    ) {
      pollStatus();
      return () => {
        if (pollTimer.current) clearTimeout(pollTimer.current);
      };
    }
  }, [state.step, pollStatus]);

  async function submitOrder() {
    dispatch({ type: "SUBMIT_START" });
    track("order_started");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiatAmount: state.amount,
          currency: state.currency,
          country: state.country,
          methodId: state.methodId,
          methodKind: state.methodKind,
          walletAddress: state.wallet,
          phoneNumber: state.phone || undefined,
          networkProvider: state.networkProvider || undefined,
          customerName: state.customerName || undefined,
          // Deliberately send a fake token address — server must ignore it
          target_token_address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        }),
      });
      const j = await res.json();
      if (!j.success) {
        const back =
          j.code === "name_mismatch" || j.code === "account_lookup_failed";
        dispatch({
          type: "SUBMIT_ERR",
          message: j.message,
          code: j.code,
          retryAfterSec: j.retryAfterSec,
          backToPayment: back,
        });
        return;
      }
      persistOrder(j.data.ref, j.data.wallet ?? state.wallet);
      window.history.pushState({}, "", `/order/${j.data.ref}`);
      const next =
        j.data.nextStep === "otp"
          ? "otp"
          : j.data.nextStep === "bank_deposit"
            ? "bank_deposit"
            : "awaiting_prompt";
      if (next === "otp") track("otp_required");
      if (next === "bank_deposit") track("bank_details_shown");
      if (next === "awaiting_prompt") track("momo_prompt_sent");
      dispatch({
        type: "SUBMIT_OK",
        ref: j.data.ref,
        nextStep: next,
        bankDeposit: j.data.bankDeposit ?? null,
      });
      if (j.data.wallet) {
        dispatch({ type: "SET_WALLET", wallet: j.data.wallet });
      }
      pollStarted.current = Date.now();
    } catch {
      dispatch({
        type: "SUBMIT_ERR",
        message: "Could not start the order. Try again or use Telegram.",
      });
    }
  }

  async function submitOtp() {
    if (!state.ref) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(state.ref)}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: state.wallet,
          otp: state.otp,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        dispatch({
          type: "SUBMIT_ERR",
          message: j.message ?? "OTP failed",
        });
        return;
      }
      dispatch({ type: "GOTO", step: "awaiting_prompt" });
    } catch {
      dispatch({ type: "SUBMIT_ERR", message: "OTP verification failed." });
    }
  }

  if (loadError && !config) {
    return (
      <div className="card p-6" role="alert">
        <p className="text-sm text-[var(--mp-text-muted)]">
          Could not load shop config. Opening Telegram desk…
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-8 bg-[var(--mp-subcard)] rounded-xl mb-4" />
        <div className="h-12 bg-[var(--mp-subcard)] rounded-xl" />
      </div>
    );
  }

  if (state.fallback || state.step === "fallback") {
    return (
      <TelegramFallback
        deskUrl={config.telegram.deskUrl}
        amount={state.amount || "50"}
        currency={state.currency}
        ticker={config.token.ticker}
        chainId={config.token.chainId}
        contract={config.token.contract}
        wallet={state.wallet}
        method={state.methodId || "mobile_money"}
        onAmount={(v) => dispatch({ type: "SET_AMOUNT", amount: v })}
        onWallet={(v) => dispatch({ type: "SET_WALLET", wallet: v })}
      />
    );
  }

  return (
    <div className="card p-5 sm:p-6 w-full max-w-[480px] mx-auto">
      {config.detectedNote && state.step === "amount" && (
        <p className="text-sm mb-3 text-[var(--mp-warning-text)] bg-[var(--mp-warning-bg)] rounded-2xl px-3 py-2">
          {config.detectedNote}
        </p>
      )}

      {state.step === "amount" && activeCountry && (
        <AmountStep
          currency={state.currency}
          amount={state.amount}
          quote={state.quote}
          quoteLoading={quoteLoading}
          quickAmounts={activeCountry.quickAmounts ?? []}
          limits={activeCountry.buyLimits}
          showFee={config.fees.showFeeLine}
          countries={config.countries}
          country={state.country}
          ticker={config.token.ticker}
          onAmount={(v) => dispatch({ type: "SET_AMOUNT", amount: v })}
          onCountry={(code, currency) => {
            dispatch({ type: "SET_COUNTRY", country: code, currency });
            track("country_changed", { code });
          }}
          onNext={() => dispatch({ type: "GOTO", step: "payment" })}
        />
      )}

      {state.step === "payment" && activeCountry && (
        <PaymentStep
          methods={activeCountry.methods}
          methodId={state.methodId}
          phone={state.phone}
          networkProvider={state.networkProvider}
          customerName={state.customerName}
          showNameField={state.showNameField}
          error={state.error}
          country={state.country}
          onMethod={(id, kind, networkProvider) => {
            dispatch({
              type: "SET_METHOD",
              methodId: id,
              methodKind: kind,
              networkProvider,
            });
            track("method_selected", { id });
          }}
          onPhone={(phone, hint) =>
            dispatch({ type: "SET_PHONE", phone, networkHint: hint })
          }
          onNetwork={(n) => dispatch({ type: "SET_NETWORK", networkProvider: n })}
          onName={(n) => dispatch({ type: "SET_NAME", customerName: n })}
          onBack={() => dispatch({ type: "GOTO", step: "amount" })}
          onNext={() => dispatch({ type: "GOTO", step: "wallet" })}
        />
      )}

      {state.step === "wallet" && (
        <WalletStep
          chainId={config.token.chainId}
          contract={config.token.contract}
          wallet={state.wallet}
          onWallet={(w) => dispatch({ type: "SET_WALLET", wallet: w })}
          onBack={() => dispatch({ type: "GOTO", step: "payment" })}
          onNext={() => dispatch({ type: "GOTO", step: "review" })}
        />
      )}

      {state.step === "review" && state.quote && (
        <ReviewStep
          quote={state.quote}
          methodId={state.methodId}
          phone={state.phone}
          wallet={state.wallet}
          chainId={config.token.chainId}
          accepted={state.acceptedRisk}
          submitting={false}
          onAccept={(v) => dispatch({ type: "SET_RISK", accepted: v })}
          onBack={() => dispatch({ type: "GOTO", step: "wallet" })}
          onConfirm={() => void submitOrder()}
        />
      )}

      {state.step === "submitting" && (
        <div className="py-10 text-center">
          <p className="font-heading font-semibold">Starting your order…</p>
        </div>
      )}

      {state.step === "awaiting_prompt" && (
        <AwaitingStep
          phone={state.phone}
          network={state.networkProvider}
          orderRef={state.ref}
        />
      )}

      {state.step === "otp" && (
        <OtpStep
          otp={state.otp}
          onOtp={(v) => dispatch({ type: "SET_OTP", otp: v })}
          onSubmit={() => void submitOtp()}
        />
      )}

      {state.step === "bank_deposit" && (
        <BankDepositStep deposit={state.bankDeposit} orderRef={state.ref} />
      )}

      {(state.step === "delivering" ||
        state.step === "completed" ||
        state.step === "still_processing" ||
        state.step === "error") && (
        <StatusStep
          step={state.step}
          orderRef={state.ref}
          txHash={state.txHash}
          explorerUrl={state.explorerUrl}
          error={state.error}
          retryAfterSec={state.retryAfterSec}
          ticker={config.token.ticker}
          contract={config.token.contract}
          deskUrl={config.telegram.deskUrl}
          onRetry={() => dispatch({ type: "GOTO", step: "amount" })}
        />
      )}
    </div>
  );
}
