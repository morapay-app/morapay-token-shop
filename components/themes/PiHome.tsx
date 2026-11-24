import { Header } from "@/components/Header";
import { BuyWidget } from "@/components/BuyWidget/BuyWidget";
import { shopConfig } from "@/shop.config";

const FLOW = ["Cedis or naira", "Morapay", "Your Pi wallet"];

/** Pi: violet stage with a gold coin; copy beside the buy card on wide screens. */
export function PiHome({
  headline,
  subline,
}: {
  headline: string;
  subline?: string;
}) {
  return (
    <section className="pi-stage" aria-label={shopConfig.token.name}>
      <Header piStage />
      <div className="pi-stage-grid">
        <div className="pi-stage-copy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shopConfig.token.logo}
            alt=""
            width={132}
            height={132}
            className="pi-stage-coin"
          />
          <h1 className="pi-stage-title font-heading">{headline}</h1>
          {subline ? <p className="pi-stage-sub">{subline}</p> : null}
          <ol className="pi-stage-flow" aria-label="How your order moves">
            {FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="pi-stage-buy">
          <BuyWidget />
        </div>
      </div>
    </section>
  );
}
