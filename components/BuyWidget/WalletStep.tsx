"use client";

import { useEffect, useMemo, useState } from "react";
import { validateWalletAddress } from "@/lib/validate/address";
import {
  resolvePayoutDestinationTag,
  validateDestinationTag,
} from "@/lib/validate/destination-tag";
import { getChain } from "@/config/chains";
import { chainKindSpec } from "@/config/chain-kinds";
import { walletAddressGroups, walletConfirmKey } from "@/lib/wallet-confirm";

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
  /** Key of the address + tag the buyer last confirmed; any edit no longer matches it. */
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const chain = getChain(chainId);
  const spec = chainKindSpec(chain);
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

  const confirmable =
    validation?.ok === true && tagValidation.ok && resolvedTag?.ok === true;
  const pendingKey = confirmable
    ? walletConfirmKey(
        validation.normalized,
        resolvedTag.value != null ? String(resolvedTag.value) : "",
      )
    : null;
  const confirmed = pendingKey != null && confirmedKey === pendingKey;

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
    if (!confirmed) return;
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

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold">Wallet</h2>
      <div>
        <label htmlFor="wallet" className="label">
          {spec.wallet.buyLabel(chain?.name ?? "chain")}
        </label>
        <div className="flex gap-2">
          <input
            id="wallet"
            className="field font-mono text-sm"
            value={wallet}
            onChange={(e) => onWallet(e.target.value)}
            placeholder={spec.wallet.buyPlaceholder}
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
          {spec.wallet.buyHelp.text}
          {spec.wallet.buyHelp.tip && (
            <>
              {" "}
              <span
                className="underline decoration-dotted cursor-help"
                title={spec.wallet.buyHelp.tip}
              >
                {spec.wallet.buyHelp.tipLabel}
              </span>
            </>
          )}
        </p>
        {validation && !validation.ok && (
          <p className="text-sm text-[var(--mp-warning-text)] mt-2" role="alert">
            {validation.reason}
          </p>
        )}
      </div>

      {spec.payoutTag && (
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

      {confirmable && pendingKey && (
        <div className="subcard p-4 space-y-3" aria-live="polite">
          <p className="text-sm font-medium">Check this is your wallet</p>
          <p className="font-mono text-sm break-all leading-6">
            {walletAddressGroups(validation.normalized).map((group, i, all) => (
              <span
                key={`${i}-${group}`}
                className={
                  i < 2 || i >= all.length - 2
                    ? "font-semibold text-[var(--mp-text)]"
                    : "text-[var(--mp-text-muted)]"
                }
              >
                {group}
                {i < all.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
          {spec.payoutTag && (
            <p className="text-sm text-[var(--mp-text-muted)]">
              Destination tag:{" "}
              <span className="font-mono text-[var(--mp-text)]">
                {resolvedTag.value != null ? String(resolvedTag.value) : "none"}
              </span>
            </p>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              onChange={(e) => setConfirmedKey(e.target.checked ? pendingKey : null)}
            />
            <span>
              I checked the start and end of this address against my wallet
              {spec.payoutTag ? " and the destination tag" : ""}. Crypto
              sent to a wrong address can&apos;t be recovered.
            </span>
          </label>
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
            resolvedTag?.ok === false ||
            !confirmed
          }
          onClick={next}
        >
          Continue
        </button>
      </div>
    </div>
  );
}