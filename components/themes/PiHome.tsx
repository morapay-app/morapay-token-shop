import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";
import type { HomeProps } from "./types";
import { CoinPair } from "@/components/TokenCoins";

/** Pi: violet stage with a gold coin; copy beside the buy card on wide screens. */
export function PiHome({ headline, subline }: HomeProps) {
  return (
    <section className="pi-stage" aria-label={shopConfig.token.name}>
      <Header variant="pi" />
      <div className="pi-stage-grid">
        <div className="pi-stage-copy">
          <CoinPair size={132} className="pi-stage-coins" />
          <h1 className="pi-stage-title font-heading">{headline}</h1>
          {subline ? <p className="pi-stage-sub">{subline}</p> : null}
        </div>
        <div className="pi-stage-buy">
          <BuyWidget />
        </div>
      </div>
    </section>
  );
}
