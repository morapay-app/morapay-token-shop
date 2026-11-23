"use client";

import { useMemo, useState } from "react";
import { validateWalletAddress } from "@/lib/validate/address";
import { validateDestinationTag } from "@/lib/validate/destination-tag";
import { getChain } from "@/config/chains";

type Props = {
  chainId: number;
  contract: string;
  wallet: string;
  payoutDestinationTag: string;
  onWallet: (w: string) => void;
  onDestinationTag: (tag: string) => void;
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
  const tagValidation = useMemo(
    () => validateDestinationTag(props.payoutDestinationTag),
    [props.payoutDestinationTag],
  );

  function paste() {
    void navigator.clipboard.readText().then((t) => props.onWallet(t.trim()));
  }

  function next() {
    if (!validation?.ok || !tagValidation.ok) return;
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

  const placeholder =
    chain?.kind === "solana"
      ? "Solana address"
      : chain?.kind === "xrpl"
        ? "r… or X-address"
        : "0x…";

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
            placeholder={placeholder}
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
          {chain?.kind === "xrpl"
            ? "Use your XRPL classic address (r…) or mainnet X-address. Exchanges often require a destination tag below."
            : "Find this in Trust Wallet, Binance Wallet, or MetaMask under Receive."}
        </p>
        {validation && !validation.ok && (
          <p className="text-sm text-[var(--mp-warning-text)] mt-2" role="alert">
            {validation.reason}
          </p>
        )}
      </div>

      {chain?.kind === "xrpl" && (
        <div>
          <label htmlFor="dest-tag" className="label">
            Destination tag (optional)
          </label>
          <input
            id="dest-tag"
            className="field font-mono text-sm"
            inputMode="numeric"
            value={props.payoutDestinationTag}
            onChange={(e) =>
              props.onDestinationTag(e.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="Required for some exchanges"
            aria-invalid={!tagValidation.ok}
          />
          <p className="text-sm text-[var(--mp-text-muted)] mt-2">
            If your wallet or exchange gave you a destination tag, enter it
            here so your XRP is credited correctly.
          </p>
          {!tagValidation.ok && (
            <p
              className="text-sm text-[var(--mp-warning-text)] mt-2"
              role="alert"
            >
              {tagValidation.reason}
            </p>
          )}
        </div>
      )}

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
          disabled={!validation?.ok || !tagValidation.ok}
          onClick={next}
        >
          Continue
        </button>
      </div>
    </div>
  );
}