"use client";

import { useState } from "react";

/** Core's refusal code when the destination is a smart-contract wallet that needs the customer's OK. */
export const SMART_WALLET_CODE = "recipient.is.smart.wallet";

type Props = {
  chainName: string;
  ticker: string;
  wallet: string;
  onConfirm: () => void;
  onChangeWallet: () => void;
};

/** Asks the customer to confirm a smart wallet (Safe, account-abstraction) before core delivers to it. */
export function SmartWalletConfirm({ chainName, ticker, wallet, onConfirm, onChangeWallet }: Props) {
  const [checked, setChecked] = useState(false);
  const short = wallet.length > 14 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Smart wallet</h3>
        <p className="mt-1 text-sm text-[var(--mp-text-muted)]">
          <span
            className="underline decoration-dotted cursor-help"
            title={`${wallet} is a contract, not a regular address. Tokens sent to a contract you don't control can't be recovered.`}
          >
            {short}
          </span>{" "}
          is a smart wallet on {chainName}.
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>
          It&apos;s my wallet and it can receive {ticker} on {chainName}.
        </span>
      </label>
      <div className="flex gap-2">
        <button type="button" className="btn-primary flex-1" disabled={!checked} onClick={onConfirm}>
          Confirm and buy
        </button>
        <button type="button" className="btn-secondary" onClick={onChangeWallet}>
          Use another wallet
        </button>
      </div>
    </div>
  );
}
