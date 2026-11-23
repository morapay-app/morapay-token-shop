"use client";

import { useEffect, useMemo, useState } from "react";
import { validateWalletAddress } from "@/lib/validate/address";
import {
  resolvePayoutDestinationTag,
  validateDestinationTag,
} from "@/lib/validate/destination-tag";
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
  const {
    chainId,
    contract,
    wallet,
    payoutDestinationTag,
    onWallet,
    onDestinationTag,
    onBack,
    onNext,
  } = props;
  const [remember, setRemember] = useState(false);
  const chain = getChain(chainId);
  const validation = useMemo(
    () =>
      wallet
        ? validateWalletAddress(wallet, chainId, contract)
        : null,
    [wallet, chainId, contract],
  );
  const tagValidation = useMemo(
    () => validateDestinationTag(payoutDestinationTag),
    [payoutDestinationTag],
  );
  const resolvedTag = useMemo(
    () =>
      validation?.ok
        ? resolvePayoutDestinationTag(
            payoutDestinationTag,
            validation.embeddedDestinationTag,
          )
        : null,
    [payoutDestinationTag, validation],
  );

  const tagLocked =
    validation?.ok === true && validation.embeddedDestinationTag != null;

  useEffect(() => {
    if (!validation?.ok || validation.embeddedDestinationTag == null) return;
    const want = String(validation.embeddedDestinationTag);
    if (payoutDestinationTag !== want) {
      onDestinationTag(want);
    }
  }, [validation, payoutDestinationTag, onDestinationTag]);

  function paste() {
    void navigator.clipboard.readText().then((t) => onWallet(t.trim()));
  }

  function next() {
    if (!validation?.ok || !tagValidation.ok || !resolvedTag?.ok) return;
    if (remember) {
      try {
        localStorage.setItem("mp_wallet", validation.normalized);
      } catch {
        /* ignore */
      }
    }
    onWallet(validation.normalized);
    onDestinationTag(
      resolvedTag.value != null ? String(resolvedTag.value) : "",
    );
    onNext();
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
            value={wallet}
            onChange={(e) => onWallet(e.target.value)}
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
            value={payoutDestinationTag}
            onChange={(e) =>
              onDestinationTag(e.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="Required for some exchanges"
            aria-invalid={!tagValidation.ok || resolvedTag?.ok === false}
            disabled={tagLocked}
            readOnly={tagLocked}
          />
          <p className="text-sm text-[var(--mp-text-muted)] mt-2">
            {tagLocked
              ? "This tag is embedded in your X-address and will be sent with your order."
              : "If your wallet or exchange gave you a destination tag, enter it here so your XRP is credited correctly."}
          </p>
          {!tagValidation.ok && (
            <p
              className="text-sm text-[var(--mp-warning-text)] mt-2"
              role="alert"
            >
              {tagValidation.reason}
            </p>
          )}
          {resolvedTag && !resolvedTag.ok && (
            <p
              className="text-sm text-[var(--mp-warning-text)] mt-2"
              role="alert"
            >
              {resolvedTag.reason}
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
        <button type="button" className="btn-ghost flex-1" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={
            !validation?.ok ||
            !tagValidation.ok ||
            resolvedTag?.ok === false
          }
          onClick={next}
        >
          Continue
        </button>
      </div>
    </div>
  );
}