import Link from "next/link";
import { shopConfig } from "@/shop.config";

export function Footer() {
  const poweredHref = `https://morapay.io/?utm_source=${shopConfig.shopId}`;
  return (
    <footer className="w-full max-w-[480px] mx-auto px-4 py-10 text-sm text-[var(--mp-text-muted)] space-y-4">
      <p>
        <a
          href={poweredHref}
          className="font-medium text-[var(--mp-text)] underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Powered by Morapay
        </a>
      </p>
      <div className="flex flex-wrap gap-3">
        {Object.entries(shopConfig.socials).map(([k, url]) => (
          <a key={k} href={url} target="_blank" rel="noreferrer" className="hover:underline">
            {k}
          </a>
        ))}
        <a href={shopConfig.telegram.deskUrl} target="_blank" rel="noreferrer" className="hover:underline">
          Telegram desk
        </a>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
      </div>
      <p>Not financial advice.</p>
    </footer>
  );
}
