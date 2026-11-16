import { getTransaction } from "@/lib/morapay/ramp";
import { interpretStatus } from "@/lib/morapay/status";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { clientIp, rateLimit, RL } from "@/lib/ratelimit";
import { getShopConfig } from "@/lib/shop-runtime";
import { getChain } from "@/config/chains";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ ref: string }> },
) {
  try {
    const { ref } = await ctx.params;
    const url = new URL(req.url);
    const wallet = url.searchParams.get("wallet_address") ?? "";
    if (!wallet) {
      return jsonErr({ message: "wallet_address is required.", status: 400 }, 400);
    }

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

    const tx = await getTransaction(ref, wallet, { buyerIp: ip });
    const interpreted = interpretStatus(tx as Parameters<typeof interpretStatus>[0]);
    const shop = getShopConfig();
    const chain = getChain(shop.token.chainId);

    return jsonOk({
      ref,
      transaction: tx,
      phase: interpreted.phase,
      message: interpreted.message,
      txHash: interpreted.txHash,
      explorerUrl:
        interpreted.txHash && chain
          ? chain.explorerTx(interpreted.txHash)
          : undefined,
    });
  } catch (err) {
    return jsonErr(err, 502);
  }
}
