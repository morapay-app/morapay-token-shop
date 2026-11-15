"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { shopConfig } from "@/shop.config";
import { validateWalletAddress } from "@/lib/validate/address";

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
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setDeposit({ ref: j.data.ref, depositAddress: j.data.depositAddress });
    } catch {
      setError("Could not start sell order.");
    } finally {
      setLoading(false);
    }
  }

  if (deposit) {
    return (
      <div className="card p-5 space-y-4">
        <h2 className="font-heading text-xl font-bold">Send tokens</h2>
        <p className="text-sm text-[var(--mp-text-muted)]">
          Send exactly {amount} ${shopConfig.token.ticker} to this deposit
          address within 5 minutes.
        </p>
        <div className="flex justify-center">
          <QRCodeSVG value={deposit.depositAddress} size={160} />
        </div>
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
