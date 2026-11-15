"use client";

import { useMemo, useState } from "react";
import { validateWalletAddress } from "@/lib/validate/address";
import { getChain } from "@/config/chains";

type Props = {
  chainId: number;
  contract: string;
  wallet: string;
  onWallet: (w: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function WalletStep(props: Props) {
  const [remember, setRemember] = useState(false);
  const chain = getChain(props.chainId);
  const validation = useMemo(
    () =>
      props.wallet
        ? validateWalletAddress(props.wallet, props.chainId, props.contract)
        : null,
    [props.wallet, props.chainId, props.contract],
  );

  function paste() {
    void navigator.clipboard.readText().then((t) => props.onWallet(t.trim()));
  }

  function next() {
    if (!validation?.ok) return;
    if (remember) {
      try {
        localStorage.setItem("mp_wallet", validation.normalized);
      } catch {
        /* ignore */
      }
    }
    props.onWallet(validation.normalized);
    props.onNext();
  }

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold">Wallet</h2>
      <div>
        <label htmlFor="wallet" className="label">
          Your {chain?.name ?? "chain"} wallet address
        </label>
        <div className="flex gap-2">
          <input
            id="wallet"
            className="field font-mono text-sm"
            value={props.wallet}
            onChange={(e) => props.onWallet(e.target.value)}
            placeholder={
              chain?.kind === "solana" ? "Solana address" : "0x…"
            }
            spellCheck={false}
            autoComplete="off"
            aria-invalid={validation ? !validation.ok : undefined}
            aria-describedby="wallet-help"
          />
          <button type="button" className="btn-ghost shrink-0" onClick={paste}>
            Paste
          </button>
        </div>
        <p id="wallet-help" className="text-sm text-[var(--mp-text-muted)] mt-2">
          Find this in Trust Wallet, Binance Wallet, or MetaMask under Receive.
        </p>
        {validation && !validation.ok && (
          <p className="text-sm text-[var(--mp-warning-text)] mt-2" role="alert">
            {validation.reason}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Remember this address on this device
      </label>

      <div className="flex gap-3">
        <button type="button" className="btn-ghost flex-1" onClick={props.onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={!validation?.ok}
          onClick={next}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
