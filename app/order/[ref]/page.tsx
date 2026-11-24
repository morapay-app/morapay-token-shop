import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { resolveHomeLayoutVariant } from "@/lib/home-layout";
import { shopConfig } from "@/shop.config";
import { OrderStatusClient } from "./OrderStatusClient";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const isPi = resolveHomeLayoutVariant(shopConfig) === "pi";
  return (
    <main className={isPi ? "shop-pi" : undefined}>
      <Header piStage={isPi} />
      <section className="w-full max-w-[480px] mx-auto px-4 py-6">
        <h1 className="font-heading text-2xl font-bold mb-4">Order status</h1>
        <OrderStatusClient orderRef={ref} />
      </section>
      <Footer />
    </main>
  );
}
