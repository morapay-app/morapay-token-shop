import { getShopConfig, getCachedRampConfig, getHealth, offeredShopTokens } from "@/lib/shop-runtime";
import { mergeCountries } from "@/lib/merge-methods";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { detectCountry } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const shop = getShopConfig();
    const live = await getCachedRampConfig();
    const health = await getHealth();
    const url = new URL(req.url);
    const detected = detectCountry({
      queryCountry: url.searchParams.get("country"),
      headers: req.headers,
      config: shop,
    });

    const countries = mergeCountries(shop, live, "buy");
    // Primary first. An extra token is listed only in the directions core offers it right now.
    const tokens = (await offeredShopTokens())
      .filter((t) => t.primary || t.comingSoon || t.buyAvailable || t.sellAvailable)
      .map((t) => ({
        ticker: t.ticker,
        comingSoon: t.comingSoon,
        name: t.name,
        label: t.label,
        hint: t.hint,
        chainId: t.chainId,
        chainName: t.chainName,
        contract: t.contract,
        decimals: t.decimals,
        logo: t.logo,
        buy: t.buyAvailable,
        sell: t.sellAvailable,
        buyCaps: t.buyCaps,
        sellMinToken: t.sellMinToken,
        sellMaxToken: t.sellMaxToken,
      }));

    return jsonOk({
      shopId: shop.shopId,
      token: {
        name: shop.token.name,
        ticker: shop.token.ticker,
        chainId: shop.token.chainId,
        contract: shop.token.contract,
        decimals: shop.token.decimals,
        logo: shop.token.logo,
      },
      tokens,
      sellEnabled: shop.sell.enabled,
      brand: {
        accent: shop.brand.accent,
        headline: shop.brand.headline,
        subline: shop.brand.subline,
      },
      defaultCountry: shop.countries.default,
      detectedCountry: detected.code,
      detectedNote: detected.note,
      countries,
      fallback: health.fallback,
      fallbackReason: health.reason,
      setupRequired: health.setupRequired === true,
      merchantSigning: health.merchantSigning,
      fees: shop.fees,
      telegram: {
        deskUrl: shop.telegram.deskUrl,
        communityUrl: shop.telegram.communityUrl,
      },
    });
  } catch (err) {
    return jsonErr(err, 500);
  }
}
