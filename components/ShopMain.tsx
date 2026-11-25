import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { resolveTheme, type ShellPage } from "@/config/themes";
import { shopConfig } from "@/shop.config";

/** Themed <main>, header and footer for every page but home (its hero holds the header). */
export function ShopMain({
  page,
  children,
}: {
  page: Exclude<ShellPage, "home">;
  children: ReactNode;
}) {
  const shell = resolveTheme(shopConfig).pages[page];
  return (
    <main className={shell.mainClass}>
      <Header variant={shell.header} active={page === "sell" ? "sell" : "buy"} />
      {children}
      <Footer />
    </main>
  );
}
