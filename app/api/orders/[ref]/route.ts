import { getTransaction } from "@/lib/morapay/ramp";
import { buildReceipt } from "@/lib/morapay/receipt";
import { interpretStatus } from "@/lib/morapay/status";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";
import { getShopConfig } from "@/lib/shop-runtime";
import { shopTokenForOrder } from "@/lib/shop-tokens";
import { isCancellableOrder } from "@/lib/order-cancel";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ ref: string }> },
) {
  try {
    const { ref } = await ctx.params;
    const ip = clientIp(req.headers);
    const rl = await rateLimit(`status:${ip}`, RL.status.limit, RL.status.windowMs);
    if (!rl.success) {
      return jsonErr(
        {
          message: "Too many status checks.",
          retryAfterSec: rl.retryAfterSec,
          status: 429,
        },
        429,
      );
    }

    const tx = await getTransaction(ref, "", { buyerIp: ip });
    const interpreted = interpretStatus(tx as Parameters<typeof interpretStatus>[0]);
    // Never return `tx`: it carries the customer's name, email and phone.
    const raw = tx as Record<string, unknown>;
    const delivery = (raw.delivery ?? {}) as Record<string, unknown>;
    const deposit = (raw.deposit ?? {}) as Record<string, unknown>;
    const orderToken = shopTokenForOrder(getShopConfig(), {
      chainId: delivery.chainId ?? raw.targetChainId,
      tokenAddress: delivery.tokenAddress ?? raw.targetTokenAddress,
      tokenSymbol: delivery.tokenSymbol ?? deposit.token ?? raw.targetTokenSymbol,
    });
    const receipt = buildReceipt(ref, raw, interpreted.phase, interpreted.txHash, orderToken.chainId);
    return jsonOk({
      ref,
      phase: interpreted.phase,
      message: interpreted.message,
      receipt,
      token: orderToken.ticker,
      // Unpaid and nothing delivered: the cancel button may show (Core still decides).
      cancellable: interpreted.phase === "in_progress" && isCancellableOrder(tx as Parameters<typeof isCancellableOrder>[0]),
    });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
