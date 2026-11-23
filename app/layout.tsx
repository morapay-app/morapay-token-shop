import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { shopConfig } from "@/shop.config";
import { resolveBrandAppleIconPath, resolveBrandFaviconPath } from "@/lib/brand-icon";
import { resolveHomeLayoutVariant } from "@/lib/home-layout";
import { accentForLightText } from "@/lib/contrast";
import "./globals.css";

// Self-hosted: next/font/google intermittently crashes CI when Google
// returns extensionless /l/font?kit= URLs (vercel/next.js#99114).
const manrope = localFont({
  src: [
    { path: "./fonts/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/manrope-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/manrope-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const instrument = localFont({
  src: [
    {
      path: "./fonts/instrument-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/instrument-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
});

/** Per-token culture stage (AMEM uses Unbounded + Space Grotesk). */
const cultureDisplay = localFont({
  src: [
    { path: "./fonts/unbounded-800.ttf", weight: "800", style: "normal" },
    { path: "./fonts/unbounded-900.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-culture-display",
  display: "swap",
});

const cultureBody = localFont({
  src: [
    { path: "./fonts/space-grotesk-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/space-grotesk-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-culture-body",
  display: "swap",
});

/** Wiki Cat display face (Alone — from wikicatcoin.com). */
const wikicatDisplay = localFont({
  src: [
    {
      path: "./fonts/wikicat/alone-earth.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-wikicat-display",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || shopConfig.siteUrl;

const brandFavicon = resolveBrandFaviconPath(
  shopConfig.shopId,
  shopConfig.brand.favicon,
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `Buy $${shopConfig.token.ticker} with Mobile Money or Bank | ${shopConfig.token.name}`,
  description: shopConfig.token.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `Buy $${shopConfig.token.ticker} with mobile money or bank`,
    description: shopConfig.token.description,
    url: siteUrl,
    siteName: shopConfig.token.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Buy $${shopConfig.token.ticker}`,
    description: shopConfig.token.description,
  },
  icons: {
    icon: brandFavicon,
    shortcut: brandFavicon,
    apple: resolveBrandAppleIconPath(shopConfig.shopId, brandFavicon),
  },
};

const homeLayout = resolveHomeLayoutVariant(shopConfig);

export const viewport: Viewport = {
  themeColor:
    homeLayout === "wikicat" || homeLayout === "simple"
      ? (shopConfig.brand.heroBg ??
          (homeLayout === "wikicat" ? "#9DE7F1" : "#ffffff"))
      : (shopConfig.culture?.stageBg ?? shopConfig.brand.heroBg ?? "#ffffff"),
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const accent = shopConfig.brand.accent;
  const accentText = shopConfig.brand.accentText ?? "#FFFFFF";
  const heroBg = shopConfig.brand.heroBg ?? "#FFFFFF";
  const accentOnLight = accentForLightText(accent, "#EFEEE2");
  const buttonBg = shopConfig.brand.overridePrimary
    ? accent
    : "var(--mp-button-bg)";

  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${instrument.variable} ${cultureDisplay.variable} ${cultureBody.variable} ${wikicatDisplay.variable} antialiased`}
        style={
          {
            "--brand-accent": accent,
            "--brand-accent-on-light": accentOnLight,
            "--brand-accent-text": accentText,
            "--brand-hero-bg": heroBg,
            ...(shopConfig.brand.overridePrimary
              ? { "--mp-button-bg": buttonBg, "--mp-button-text": accentText }
              : {}),
          } as CSSProperties
        }
      >
        {children}
        {shopConfig.analytics.plausibleDomain ||
        process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <script
            defer
            data-domain={
              process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ||
              shopConfig.analytics.plausibleDomain
            }
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </body>
    </html>
  );
}
