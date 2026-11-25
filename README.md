# Morapay Token Shop

Cloneable **Next.js** template for community token shops. Each business runs its own shop with **Morapay Merchant API** keys so orders earn on that merchant account — not on Morapay’s unsigned public platform key.

**Repo:** [morapay-app/morapay-token-shop](https://github.com/morapay-app/morapay-token-shop)

## What it is

- Buyers pay with **mobile money or bank**; tokens settle to their wallet.
- The browser **never** talks to `api.morapay.io` — only your Next.js `/api/*` routes do, with **HMAC-signed** merchant requests.
- Branding, token, countries, and payment methods come from **`examples/<shop>.config.ts`** + `/public/brand/*` + env vars.

## Get Morapay merchant keys

1. Create a business on [Morapay](https://morapay.io) and complete onboarding.
2. Dashboard → **Developers → API keys** → create a **TEST** or **LIVE** pair (`pk_*` + `sk_*`).
3. Copy **public** key to `MORAPAY_MERCHANT_PUBLIC_KEY` and **secret** to `MORAPAY_MERCHANT_SECRET_KEY` (server env only).
4. Set `MORAPAY_ENV=test` or `live` to match the key prefix.

Docs: [Authentication](https://docs.morapay.io/getting-started/authentication), [Merchant ramp](https://docs.morapay.io/api-reference/merchant-ramp).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MORAPAY_MERCHANT_PUBLIC_KEY` | Yes | `pk_test_*` / `pk_live_*` |
| `MORAPAY_MERCHANT_SECRET_KEY` | Yes | `sk_test_*` / `sk_live_*` (never expose) |
| `MORAPAY_ENV` | Yes | `test` or `live` — must match keys |
| `MORAPAY_API_BASE` | No | Default `https://api.morapay.io` |
| `SHOP_ID` | Yes | Shop identifier for analytics |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL |
| `MORAPAY_REFERRAL_CODE` | No | `MP-XXXXXX` attribution override |
| `FORCE_FALLBACK` | No | Telegram-only mode |
| `MORAPAY_ALLOW_PUBLIC_FALLBACK` | No | **Off by default.** Enables legacy unsigned `/api/public/*` |
| `TRUST_CLOUDFLARE_IP` | No | Use `CF-Connecting-IP` when behind Cloudflare |

See [`.env.example`](.env.example).

## Launch a shop in 5 minutes

1. **Fork / clone** this repo.
2. **`pnpm new-shop`** (see [Adding a shop](#adding-a-shop)).
3. **Brand assets** in `/public/brand/`.
4. **Set env vars** (merchant keys + `SHOP_ID` + `NEXT_PUBLIC_SITE_URL`).
5. **Deploy** — open `/api/health` → expect `merchantSigning: true` and `tokenSupported: true` when your token is listed on the merchant ramp config.
6. **Test** at minimum buy amount before announcing.

## Local development

```bash
pnpm install
cp .env.example .env.local
# Add your pk_test_ / sk_test_ keys
pnpm dev
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm smoke:live   # read-only signed Morapay checks — does not place orders
```

Without merchant keys, the buy widget shows a **setup screen** (no silent unsigned mode).

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/morapay-app/morapay-token-shop&env=MORAPAY_MERCHANT_PUBLIC_KEY,MORAPAY_MERCHANT_SECRET_KEY,MORAPAY_ENV,SHOP_ID,NEXT_PUBLIC_SITE_URL&envDescription=See%20.env.example&project-name=my-token-shop)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https://github.com/morapay-app/morapay-token-shop)

| Target | Notes |
|---|---|
| **Vercel** | Set merchant env vars from `.env.example`. |
| **Railway** | `Dockerfile` + `railway.json`; healthcheck `/api/health`. |
| **Cloudflare** | Set `TRUST_CLOUDFLARE_IP=true` for buyer IP attribution. |

## How earnings work

Orders are created via **`/api/v1/merchant/ramp/*`** signed with **your** merchant key. Morapay attributes volume and **merchant markup/fees** to your business (configured in the merchant portal). Unsigned public ramp calls do not attribute revenue to your business.

## Going live

1. Issue **live** keys (`pk_live_*` / `sk_live_*`).
2. Set `MORAPAY_ENV=live`.
3. Confirm token appears in `GET /api/v1/merchant/ramp/config` for your account.
4. Run a real minimum buy yourself; monitor `/api/health` and order status.

## Security

- **Never** put `sk_*` in `NEXT_PUBLIC_*` or client code.
- Rotate secret keys immediately if leaked; update Railway/Vercel env and redeploy.
- Buyer IPs are forwarded on outbound Morapay calls (`X-Forwarded-For`, `X-Real-IP`) so ramp abuse keys on shoppers, not your host egress IP.

## Adding a shop

One repo builds every shop; `SHOP_ID` picks which.

1. `pnpm new-shop` (or copy a file in `examples/` and list it in `SHOPS` in `shop.config.ts`).
2. Countries: use the presets in `config/markets.ts`, e.g. `list: [ghana(), nigeria()]`.
3. Brand files in `public/brand/<shopId>/`.
4. Wording: the default copy is for community tokens. Override it with `copy` (`about`, `operator`, `risk`) and `faqExtra`.
5. Look: set `brand.layoutVariant` to an existing theme, or add one (below).
6. Deploy with `SHOP_ID=<shopId>`, `NEXT_PUBLIC_SITE_URL` and the merchant keys.

Components never test `shopId` or the chain. Per-shop and per-chain differences live here:

| Path | Purpose |
|---|---|
| `examples/*.config.ts` | One file per shop: token, brand, countries, sell limits, wording |
| `shop.config.ts` | Shop list; validates the one `SHOP_ID` selects |
| `config/markets.ts` | Country and payment-method presets |
| `config/chains.ts` | Networks and explorers |
| `config/chain-kinds.ts` | Per chain kind: address labels and placeholders, native asset, memo or destination tag, tx hash |
| `lib/validate/address.ts` | Address validation per chain kind |
| `config/themes.ts` | Per theme: page class, header style, browser and share-image colours |
| `components/themes/`, `app/themes/*.css` | Each theme's home hero and styles |
| `components/og/` | Share images (`brand.ogImage`) |
| `lib/shop-copy.ts` | Default FAQ and risk text |
| `components/BuyWidget/`, `components/SellWidget/` | Buy and sell flows, shared by every shop |

**New theme:** add the name to `layoutVariant` in `config/schema.ts`, an entry in `THEMES` and `HOMES`, and a stylesheet imported in `app/layout.tsx`.
**New chain kind:** add it to `ChainInfo["kind"]`; TypeScript then asks for its `CHAIN_KINDS` and address `RULES` entries.

## Architecture

- Next.js 15 App Router, TypeScript, Tailwind v4, zod
- `lib/morapay/sign.ts` — HMAC v1 (`Morapay-Key`, `Morapay-Timestamp`, `Morapay-Signature`)
- `lib/morapay/client.ts` — signed fetch + envelope parsing
- Sells: `components/SellWidget/InstitutionPicker.tsx` lists banks and networks by name; NGN accounts must pass the name check (`POST /api/institutions/resolve`) before Continue
- Fallback: Telegram desk when token unsupported or `FORCE_FALLBACK=true`

## Default example

**MILAN** (`examples/milan.config.ts`) — BNB Chain, GHS MoMo + bank, NGN bank.  
**AMEM** (`examples/amem.config.ts`) — reference production branding.  
**WikiCat** (`examples/wikicat.config.ts`) — WKC on BNB Chain; NGN bank + Ghana MoMo; buy and sell enabled.

### WikiCat demo deploy

For the SMC partner shop, set the same merchant env vars as any other shop and:

```bash
SHOP_ID=wikicat
NEXT_PUBLIC_SITE_URL=https://your-wikicat-host.example
```

Brand assets live under `public/brand/wikicat/`. With `SHOP_ID=wikicat`, the build picks `public/brand/wikicat/favicon.ico` automatically (or set `brand.favicon` in the shop config). WikiCat uses `brand.layoutVariant: "wikicat"` for its own property theme (not the culture-stage layout used by AMEM).

On **Railway**, add a new service from this repo with `SHOP_ID=wikicat`, your `pk_*` / `sk_*` keys, `MORAPAY_ENV`, and `NEXT_PUBLIC_SITE_URL` for the public URL.

**IPOD** (`examples/ipod.config.ts`) — IPOD on Base (chain `8453`); simple hero layout; NGN bank + Ghana MoMo. Token metadata is aligned with Morapay’s catalog (`GET /api/public/catalog/tokens?chain_id=8453`).

### IPOD deploy

```bash
SHOP_ID=ipod
NEXT_PUBLIC_SITE_URL=https://your-ipod-host.example
```

Same `MORAPAY_MERCHANT_PUBLIC_KEY`, `MORAPAY_MERCHANT_SECRET_KEY`, `MORAPAY_ENV`, and `MORAPAY_API_BASE` as other shops. Verify with `pnpm smoke:ipod` (read-only quotes; no orders).

**Pi** (`examples/pi.config.ts`) — native PI on Pi Network (internal chain `31415926`, contract id `pi`, 7 decimals); same countries and methods as the XRP shop. Buyers enter a G… Pi wallet address (StrKey checksum checked; M… and secret keys refused). Sells show our Pi address, the exact amount and a per-order memo from core (`lib/morapay/offramp-deposit.ts` maps the field names).

### Pi deploy

```bash
SHOP_ID=pi
NEXT_PUBLIC_SITE_URL=https://pi.morapay.shop
```

Same merchant env vars as the XRP shop. `/api/health` reports `tokenSupported: true` only once core lists chain `31415926` on the merchant ramp.

## Compliance

No investment hype. Risk disclaimer stays visible. Confirm regulatory status before paid ads.

## License

MIT
