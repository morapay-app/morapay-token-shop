import Link from "next/link";
import { shopConfig } from "@/shop.config";

export function Header({
  onCulture = false,
  wikiCat = false,
}: {
  onCulture?: boolean;
  wikiCat?: boolean;
}) {
  return (
    <header
      className={
        wikiCat
          ? "wikicat-header"
          : onCulture
            ? "culture-header"
            : "w-full max-w-[480px] mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center justify-between gap-3"
      }
    >
      <Link href="/" className="flex items-center gap-3 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shopConfig.token.logo}
          alt=""
          width={40}
          height={40}
          className={
            onCulture || wikiCat
              ? "rounded-full"
              : "rounded-full bg-[var(--mp-subcard)]"
          }
        />
        <div className="min-w-0">
          <p className="font-heading font-bold truncate">
            {shopConfig.token.name}
          </p>
          <p
            className={
              onCulture
                ? "text-xs opacity-70"
                : wikiCat
                  ? "text-xs wikicat-header-ticker"
                  : "text-xs text-[var(--mp-text-muted)]"
            }
          >
            ${shopConfig.token.ticker}
          </p>
        </div>
      </Link>
      {shopConfig.sell.enabled && (
        <nav className="flex gap-1 bg-[var(--mp-pill-inactive)] p-1 rounded-full">
          <Link
            href="/"
            className="pill px-3 py-1.5 text-sm bg-[var(--mp-pill-active)]"
          >
            Buy
          </Link>
          <Link href="/sell" className="pill px-3 py-1.5 text-sm">
            Sell
          </Link>
        </nav>
      )}
    </header>
  );
}
