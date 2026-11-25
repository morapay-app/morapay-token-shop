import Link from "next/link";
import type { HeaderStyle } from "@/config/themes";
import { shopConfig } from "@/shop.config";

type Style = { header: string; logo: string; ticker: string; navLink?: string };

const STYLES: Record<HeaderStyle, Style> = {
  plain: {
    header:
      "w-full max-w-[480px] mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center justify-between gap-3",
    logo: "rounded-full bg-[var(--mp-subcard)]",
    ticker: "text-xs text-[var(--mp-text-muted)]",
  },
  culture: { header: "culture-header", logo: "rounded-full", ticker: "text-xs opacity-70" },
  wikicat: {
    header: "wikicat-header",
    logo: "rounded-full",
    ticker: "text-xs wikicat-header-ticker",
  },
  simple: {
    header: "brand-hero-header",
    logo: "rounded-full",
    ticker: "text-xs brand-hero-header-ticker",
  },
  pi: {
    header: "pi-header",
    logo: "rounded-full",
    ticker: "text-xs pi-header-ticker",
    navLink: "pi-nav-link",
  },
};

const NAV = [
  { page: "buy", href: "/", label: "Buy" },
  { page: "sell", href: "/sell", label: "Sell" },
] as const;

export function Header({
  variant = "plain",
  active = "buy",
}: {
  variant?: HeaderStyle;
  active?: "buy" | "sell";
}) {
  const style = STYLES[variant];
  return (
    <header className={style.header}>
      <Link href="/" className="flex items-center gap-3 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shopConfig.token.logo}
          alt=""
          width={40}
          height={40}
          className={style.logo}
        />
        <div className="min-w-0">
          <p className="font-heading font-bold truncate">
            {shopConfig.token.name}
          </p>
          <p className={style.ticker}>${shopConfig.token.ticker}</p>
        </div>
      </Link>
      {shopConfig.sell.enabled && (
        <nav className="flex gap-1 bg-[var(--mp-pill-inactive)] p-1 rounded-full">
          {NAV.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              className={`pill px-3 py-1.5 text-sm ${active === item.page ? "bg-[var(--mp-pill-active)]" : ""} ${style.navLink ?? ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
