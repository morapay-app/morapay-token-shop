"use client";

import { useMemo } from "react";
import { buildDeskDeepLink } from "@/lib/telegram";
import { getChain } from "@/config/chains";
import { flagFor } from "@/config/countries";
import { shopConfig } from "@/shop.config";
import { track } from "@/lib/analytics";

type Props = {
  deskUrl: string;
  amount: string;
  currency: string;
  ticker: string;
  chainId: number;
  contract: string;
  wallet: string;
  method: string;
  countries: Array<{ code: string; currency: string }>;
  country: string;
  onCountry: (code: string, currency: string) => void;
  onAmount: (v: string) => void;
  onWallet: (v: string) => void;
};

export function TelegramFallback(props: Props) {
  const chain = getChain(props.chainId);
  const href = useMemo(
    () =>
      buildDeskDeepLink({
        deskUrl: props.deskUrl,
        amount: props.amount || "—",
        currency: props.currency,
        ticker: props.ticker,
        chainName: chain?.name ?? String(props.chainId),
        contract: props.contract,
        wallet: props.wallet || "—",
        method: props.method,
        shopId: shopConfig.shopId,
      }),
    [props, chain],
  );

  return (
    <div className="card p-5 sm:p-6 w-full max-w-[480px] mx-auto space-y-4">
      <div
        className="rounded-2xl px-3 py-2 text-sm bg-[var(--mp-warning-bg)] text-[var(--mp-warning-text)]"
        role="status"
      >
        Instant checkout is temporarily unavailable. Our team will complete your
        order on Telegram.
      </div>
      <h2 className="font-heading text-xl font-bold">Continue on Telegram</h2>
      <div>
        <label htmlFor="fb-country" className="label">
          Country
        </label>
        <select
          id="fb-country"
          className="field"
          value={props.country}
          onChange={(e) => {
            const c = props.countries.find((x) => x.code === e.target.value);
            if (c) props.onCountry(c.code, c.currency);
          }}
        >
          {props.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {flagFor(c.code)} {c.currency}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="fb-amount" className="label">
          Amount ({props.currency})
        </label>
        <input
          id="fb-amount"
          className="field"
          inputMode="decimal"
          value={props.amount}
          onChange={(e) => props.onAmount(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="fb-wallet" className="label">
          Wallet address
        </label>
        <input
          id="fb-wallet"
          className="field font-mono text-sm"
          value={props.wallet}
          onChange={(e) => props.onWallet(e.target.value)}
        />
      </div>
      <a
        className="btn-primary w-full text-center"
        href={href}
        onClick={() => track("fallback_used")}
      >
        Open Telegram desk
      </a>
    </div>
  );
}
