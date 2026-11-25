import { ShopMain } from "@/components/ShopMain";
import { OrderStatusClient } from "./OrderStatusClient";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return (
    <ShopMain page="order">
      <section className="w-full max-w-[480px] mx-auto px-4 py-6">
        <h1 className="font-heading text-2xl font-bold mb-4">Order status</h1>
        <OrderStatusClient orderRef={ref} />
      </section>
    </ShopMain>
  );
}
