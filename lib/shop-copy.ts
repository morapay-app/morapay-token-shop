import { getChain } from "@/config/chains";
import { chainKindSpec } from "@/config/chain-kinds";
import type { ShopConfig } from "@/config/schema";

/** Community defaults; a shop overrides them with `copy` in its config. */
function shopCopy(shop: ShopConfig) {
  const { ticker } = shop.token;
  return {
    about:
      shop.copy.about ??
      `A community page where you can buy $${ticker} with mobile money or bank transfer, powered by Morapay.`,
    operator:
      shop.copy.operator ?? `The $${ticker} community, using Morapay’s payment service.`,
    risk:
      shop.copy.risk ??
      `Crypto assets are highly volatile and you can lose all the money you spend. Meme tokens are especially risky and have no guaranteed value. This site is run by the ${ticker} community. Payments and delivery are processed by Morapay. Nothing here is financial advice. Check the contract address before you buy, and only spend what you can afford to lose. Blockchain transfers can't be reversed.`,
  };
}

export function riskText(shop: ShopConfig): string {
  return shopCopy(shop).risk;
}

export function faqItems(shop: ShopConfig): { q: string; a: string }[] {
  const copy = shopCopy(shop);
  return [
    { q: "What is this?", a: copy.about },
    {
      q: "Do I need an exchange account?",
      a: "No. You only need a wallet address that can receive the token on the supported chain.",
    },
    {
      q: "Which wallet do I need?",
      a: chainKindSpec(getChain(shop.token.chainId)).wallet.faq,
    },
    {
      q: "How long does it take?",
      a: "Usually a few minutes after you pay. Timing depends on the payment network and blockchain.",
    },
    { q: "What are the fees?", a: "Fees are shown in the quote before you confirm." },
    {
      q: "What if my payment fails?",
      a: "You will see a clear status and reference. Contact the Telegram desk with that reference for help.",
    },
    {
      q: "Is Morapay holding my tokens?",
      a: "No. Tokens are sent to your own wallet.",
    },
    { q: "Who runs this site?", a: copy.operator },
    { q: "How do I get support?", a: "Use the Telegram desk link in the footer." },
    ...shop.faqExtra,
  ];
}
