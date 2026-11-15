"use client";

import { shopConfig } from "@/shop.config";
import { getChain } from "@/config/chains";

export function TokenInfo() {
  const chain = getChain(shopConfig.token.chainId);
  const explorer =
    shopConfig.token.explorerTokenUrl ??
    (chain ? chain.explorerAddress(shopConfig.token.contract) : "#");

  return (
    <section className="w-full max-w-[480px] mx-auto px-4 py-8 space-y-4">
      <h2 className="font-heading text-2xl font-bold">Token info</h2>
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shopConfig.token.logo}
            alt=""
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <p className="font-heading font-bold">
              {shopConfig.token.name}{" "}
              <span className="text-[var(--brand-accent-on-light)]">${shopConfig.token.ticker}</span>
            </p>
            <p className="text-sm text-[var(--mp-text-muted)]">
              {chain?.name ?? `Chain ${shopConfig.token.chainId}`} ·{" "}
              {shopConfig.token.decimals} decimals
            </p>
          </div>
        </div>
        <p className="text-sm">{shopConfig.token.description}</p>
        <div className="subcard p-3">
          <p className="text-xs text-[var(--mp-text-muted)] mb-1">Contract</p>
          <p className="font-mono text-xs break-all">{shopConfig.token.contract}</p>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() =>
                void navigator.clipboard.writeText(shopConfig.token.contract)
              }
            >
              Copy
            </button>
            <a
              className="btn-ghost text-xs"
              href={explorer}
              target="_blank"
              rel="noreferrer"
            >
              Explorer
            </a>
          </div>
        </div>
        <p className="text-sm text-[var(--mp-warning-text)]">
          Only trust this contract address.
        </p>
      </div>

      {shopConfig.altBuyLinks.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold mb-2">Other ways to buy</h3>
          <ul className="space-y-2">
            {shopConfig.altBuyLinks.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--brand-accent-on-light)] underline-offset-2 hover:underline"
                >
                  {l.label}
                </a>
                {l.note ? (
                  <span className="text-sm text-[var(--mp-text-muted)]"> — {l.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
