import { ImageResponse } from "next/og";
import { shopConfig } from "@/shop.config";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: "#EFEEE2",
          color: "#2B0A30",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: shopConfig.brand.accent,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          ${shopConfig.token.ticker}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            Buy ${shopConfig.token.ticker}
          </div>
          <div style={{ fontSize: 28, color: "#8A8578" }}>
            with mobile money or bank
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#0F5C3E" }}>Powered by Morapay</div>
      </div>
    ),
    { ...size },
  );
}
