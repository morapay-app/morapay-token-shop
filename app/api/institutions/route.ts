import { z } from "zod";
import { getBanks } from "@/lib/morapay/ramp";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { listedInstitutions } from "@/lib/sell";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rl = await rateLimit(`inst:${ip}`, RL.status.limit, RL.status.windowMs);
    if (!rl.success) {
      return jsonErr(
        { message: "Too many requests. Please wait.", retryAfterSec: rl.retryAfterSec, status: 429 },
        429,
      );
    }

    const url = new URL(req.url);
    const currency = z
      .string()
      .min(3)
      .max(3)
      .parse(url.searchParams.get("currency")?.toLowerCase());

    const data = await getBanks(currency, { buyerIp: ip });
    return jsonOk({ ...data, institutions: listedInstitutions(data.institutions) });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
