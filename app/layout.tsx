import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Sans } from "next/font/google";
import { shopConfig } from "@/shop.config";
import { accentForLightText } from "@/lib/contrast";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["600", "700", "800"],
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: ["400", "500"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || shopConfig.siteUrl;

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
    icon: "/brand/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
        className={`${manrope.variable} ${instrument.variable} antialiased`}
        style={
          {
            "--brand-accent": accent,
            "--brand-accent-on-light": accentOnLight,
            "--brand-accent-text": accentText,
            "--brand-hero-bg": heroBg,
            ...(shopConfig.brand.overridePrimary
              ? { "--mp-button-bg": buttonBg, "--mp-button-text": accentText }
              : {}),
          } as React.CSSProperties
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
