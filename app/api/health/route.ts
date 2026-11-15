import { getHealth } from "@/lib/shop-runtime";
import { jsonOk } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getHealth();
  return jsonOk(health);
}
