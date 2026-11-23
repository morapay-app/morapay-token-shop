"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { shopConfig } from "@/shop.config";
import { validateWalletAddress } from "@/lib/validate/address";
import { getChain } from "@/config/chains";

/**
 * Sell flow — only mounted when config.sell.enabled.
 * Deposit address must never equal the token contract.
 */
export function SellWidget() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [wallet, setWallet] = useState("");
  const [bankCode, setBankCode] = useState("0004");
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

  const tagRequired = isXrpl && deposit?.depositDestinationTag != null;

  if (deposit) {
    const qrValue =
      tagRequired && deposit.depositDestinationTag != null
        ? `${deposit.depositAddress}?dt=${deposit.depositDestinationTag}`
        : deposit.depositAddress;

    return (
      <div className="card p-5 space-y-4">
        <h2 className="font-heading text-xl font-bold">Send tokens</h2>
        <p className="text-sm text-[var(--mp-text-muted)]">
          Send exactly {amount} ${shopConfig.token.ticker} to the address below
          within 5 minutes.
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

  return (
    <div className="card p-5 space-y-4">
      <div>
        <label htmlFor="sell-amount" className="label">
          Token amount
        </label>
        <input
          id="sell-amount"
          className="field font-numbers text-2xl"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
        />
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
          <option value="GHS">GHS</option>
          <option value="NGN">NGN</option>
        </select>
      </div>
      <div>
        <label htmlFor="sell-bank" className="label">
          Payout institution code
        </label>
        <input
          id="sell-bank"
          className="field"
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="sell-account" className="label">
          Account / phone
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
        disabled={loading || !amount || !account || !wallet}
        onClick={() => void submit()}
      >
        {loading ? "Starting…" : "Continue"}
      </button>
    </div>
  );
}