import Link from "next/link";
import { shopConfig } from "@/shop.config";

export function Header({
  onCulture = false,
  wikiCat = false,
  brandHero = false,
  piStage = false,
  active = "buy",
}: {
  onCulture?: boolean;
  wikiCat?: boolean;
  brandHero?: boolean;
  piStage?: boolean;
  active?: "buy" | "sell";
}) {
  return (
    <header
      className={
        piStage
          ? "pi-header"
          : wikiCat
          ? "wikicat-header"
          : brandHero
            ? "brand-hero-header"
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
            onCulture || wikiCat || brandHero || piStage
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
              piStage
                ? "text-xs pi-header-ticker"
                : onCulture
                ? "text-xs opacity-70"
                : wikiCat
                  ? "text-xs wikicat-header-ticker"
                  : brandHero
                    ? "text-xs brand-hero-header-ticker"
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
            className={`pill px-3 py-1.5 text-sm ${active === "buy" ? "bg-[var(--mp-pill-active)]" : ""} ${piStage ? "pi-nav-link" : ""}`}
          >
            Buy
          </Link>
          <Link
            href="/sell"
            className={`pill px-3 py-1.5 text-sm ${active === "sell" ? "bg-[var(--mp-pill-active)]" : ""} ${piStage ? "pi-nav-link" : ""}`}
          >
            Sell
          </Link>
        </nav>
      )}
    </header>
  );
}
