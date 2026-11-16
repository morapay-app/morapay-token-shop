import { getShopConfig, getCachedRampConfig, getHealth } from "@/lib/shop-runtime";
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
