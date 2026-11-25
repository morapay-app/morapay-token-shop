"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
  ticker: string;
  amount: string;
  depositAddress: string;
  destinationTag?: string | number;
  /** XRPL: the tag ties the payment to the order. */
  tagRequired: boolean;
};

/** Sell deposit to an address, with a destination tag where the chain needs one. */
export function AddressDepositInstructions({
  ticker,
  amount,
  depositAddress,
  destinationTag,
  tagRequired,
}: Props) {
  const qrValue =
    tagRequired && destinationTag != null
      ? `${depositAddress}?dt=${destinationTag}`
      : depositAddress;

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-heading text-xl font-bold">Send {ticker}</h2>
      <p className="text-sm text-[var(--mp-text-muted)]">
        Send exactly {amount} {ticker} to the address below now. Orders with no
        deposit are cancelled.
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
            <span className="font-mono font-bold">{String(destinationTag)}</span>.
            Sending without this tag can mean lost funds.
          </p>
        </div>
      )}
      <div className="flex justify-center">
        <QRCodeSVG value={qrValue} size={160} />
      </div>
      <div className="space-y-2">
        <p className="label mb-0">Deposit address</p>
        <p className="font-mono text-xs break-all subcard p-3">{depositAddress}</p>
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={() => void navigator.clipboard.writeText(depositAddress)}
        >
          Copy address
        </button>
      </div>
      {destinationTag != null && destinationTag !== "" ? (
        <div className="space-y-2">
          <p className="label mb-0">Destination tag</p>
          <p className="font-mono text-lg font-bold subcard p-3 text-center">
            {String(destinationTag)}
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() =>
              void navigator.clipboard.writeText(String(destinationTag))
            }
          >
            Copy destination tag
          </button>
        </div>
      ) : null}
    </div>
  );
}
