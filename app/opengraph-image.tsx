import { ImageResponse } from "next/og";
import { shopConfig } from "@/shop.config";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const ticker = `$${shopConfig.token.ticker}`;
  const accent = shopConfig.brand.accent;
  const stageBg = shopConfig.culture?.stageBg ?? "#0A0A0A";
  const stageText = shopConfig.culture?.stageText ?? "#F5F1E6";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: stageBg,
          color: stageText,
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
    ),
    { ...size },
  );
}
