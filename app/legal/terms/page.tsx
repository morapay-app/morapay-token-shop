import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { shopConfig } from "@/shop.config";

export default function TermsPage() {
  return (
    <main>
      <Header />
      <article className="w-full max-w-[480px] mx-auto px-4 py-8 prose-sm space-y-4">
        <h1 className="font-heading text-3xl font-bold">Terms</h1>
        <p className="text-sm text-[var(--mp-text-muted)]">
          {/* TODO(owner): entity name, address, support email */}
          This site is operated by the {shopConfig.token.ticker} community.
          Payments and token delivery are processed by Morapay. Replace this
          placeholder with your legal entity details before production use.
        </p>
        <p>
          By using this site you confirm you are 18+, understand crypto assets
          are volatile, and accept that blockchain transfers cannot be reversed.
          Nothing on this site is financial advice.
        </p>
      </article>
      <Footer />
    </main>
  );
}
