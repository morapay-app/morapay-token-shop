import { shopConfig } from "@/shop.config";
import { shopTokens } from "@/lib/shop-tokens";

/** Distinct token logos of this shop, open tokens first (Pi shop: PCM, then Pi). */
export function shopLogos(): string[] {
  const tokens = shopTokens(shopConfig);
  const ordered = [...tokens.filter((t) => !t.comingSoon), ...tokens.filter((t) => t.comingSoon)];
  return [...new Set(ordered.map((t) => t.logo).filter(Boolean))];
}

/** One coin that flips between the first two logos; a plain logo when there is only one. */
export function FlipCoin({ size, className = "" }: { size: number; className?: string }) {
  const [front, back] = shopLogos();
  if (!front) return null;
  if (!back) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={front} alt="" width={size} height={size} className={className} />;
  }
  return (
    <span className={`flip-coin ${className}`} style={{ width: size, height: size }} aria-hidden>
      <span className="flip-coin-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={front} alt="" width={size} height={size} className="flip-coin-face" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={back} alt="" width={size} height={size} className="flip-coin-face flip-coin-back" />
      </span>
    </span>
  );
}

/** The shop's coins side by side, slightly overlapped. */
export function CoinPair({ size, className = "" }: { size: number; className?: string }) {
  const logos = shopLogos().slice(0, 2);
  return (
    <span className={`coin-pair ${className}`} aria-hidden>
      {logos.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" width={size} height={size} className="coin-pair-coin" />
      ))}
    </span>
  );
}
