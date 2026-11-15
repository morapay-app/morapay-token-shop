import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main>
      <Header />
      <article className="w-full max-w-[480px] mx-auto px-4 py-8 space-y-4">
        <h1 className="font-heading text-3xl font-bold">Privacy</h1>
        <p className="text-sm text-[var(--mp-text-muted)]">
          {/* TODO(owner): entity name, address, support email */}
          We do not run a separate order database. Payment details you submit are
          sent to Morapay to process your order. This device may store your last
          wallet address and order reference locally. Analytics (if enabled) do
          not include phone numbers or names.
        </p>
        <p>
          Contact the Telegram desk linked in the footer for privacy requests.
          Replace this placeholder with your controller details before production
          use.
        </p>
      </article>
      <Footer />
    </main>
  );
}
