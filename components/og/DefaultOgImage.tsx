import { ogStage } from "@/config/themes";
import { shopConfig } from "@/shop.config";

export function DefaultOgImage() {
  const ticker = `$${shopConfig.token.ticker}`;
  const accent = shopConfig.brand.accent;
  const stage = ogStage(shopConfig);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: stage.bg,
        color: stage.text,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          color: accent,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {ticker}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {`Buy ${ticker}`}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(245,241,230,0.65)",
          }}
        >
          with mobile money or bank
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          color: accent,
        }}
      >
        Powered by Morapay
      </div>
    </div>
  );
}
