# Morapay Token Shop

Cloneable Next.js template for community token shops powered by Morapay’s public ramp API. Buy tokens with mobile money or bank — config + brand assets + env vars only.

**Repo:** [morapay-app/morapay-token-shop](https://github.com/morapay-app/morapay-token-shop)

## Launch a token shop in 5 minutes

1. **Check the token is supported**:
   ```bash
   curl -s https://api.morapay.io/api/public/ramp/config \
     | jq '.data.supportedOnrampTargets[] | select(.symbol=="YOURTICKER")'
   ```
   No result? Ask Morapay to list it first (the shop will run in Telegram fallback mode until then).
2. **Click a Deploy button** (Vercel recommended) → it forks this repo.
3. **Edit `shop.config.ts`** in your fork (start from `examples/milan.config.ts`):
   token name, ticker, chainId, contract, decimals, accent colour, socials, Telegram desk link,
   your Morapay referral code (`MP-XXXXXX`), and which countries/methods to show.
4. **Add images** to `/public/brand/`: `logo.png` (512×512), `hero.jpg` (≤1080px wide).
5. **Set env vars**: `MORAPAY_API_BASE=https://api.morapay.io`, `SHOP_ID=yourtoken`,
   `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`, `MORAPAY_REFERRAL_CODE=MP-XXXXXX`.
6. **Deploy**, then open `/api/health`, which should show `tokenSupported: true`.
7. **Test** with the minimum amount yourself before announcing. Use factual posts only (see Compliance).

Or locally: `pnpm new-shop` to copy an example and prompt for fields.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/morapay-app/morapay-token-shop&env=MORAPAY_API_BASE,SHOP_ID,NEXT_PUBLIC_SITE_URL,MORAPAY_REFERRAL_CODE&envDescription=See%20.env.example&project-name=my-token-shop)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https://github.com/morapay-app/morapay-token-shop)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/morapay-app/morapay-token-shop)

| Target | Notes |
|---|---|
| **Vercel** | Zero-config Next.js. Set env vars from `.env.example`. |
| **Railway** | `Dockerfile` + `railway.json` (standalone output). `railway up` then set variables. |
| **Cloudflare** | Install `@opennextjs/cloudflare` + `wrangler`, then `pnpm cf:deploy`. Geo header: `cf-ipcountry`. |

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke:live   # read-only Morapay checks — does not place orders
```

## What you edit for a new shop

| Path | Purpose |
|---|---|
| `shop.config.ts` | Token, branding, countries, methods, sell toggle, Telegram, referral |
| `public/brand/*` | `logo.png`, `hero.jpg`, `favicon.ico` |
| Env vars | See `.env.example` |

No other code changes required.

## Architecture

- Next.js 15 App Router + TypeScript + Tailwind CSS v4 + zod
- Browser never calls `api.morapay.io` — all traffic goes through `/app/api/*`
- Config ∩ live ramp config drives which countries/methods are selectable
- Fallback: Telegram desk deep-link when API is down, token unsupported, or `FORCE_FALLBACK=true`
- Sell (offramp) is **off by default** (`sell.enabled: false`)

## Default example

MILAN (`examples/milan.config.ts`) — BNB Chain, GHS MoMo + bank, NGN bank. Sell disabled.

## TODO(owner) placeholders

Documented in the build brief (section 19). Scaffold uses:

| Item | Placeholder |
|---|---|
| Telegram desk | `https://t.me/morapay` |
| Referral code | unset — set `MORAPAY_REFERRAL_CODE` or `attribution.referralCode` |
| Turnstile | optional via `TURNSTILE_*` env |
| Legal entity | Terms / Privacy pages marked TODO(owner) |
| Card / KES / etc. | config-ready, disabled until ramp supports them |
| GRIOT example | `examples/griot.config.ts` needs real contract + branding |

## Compliance

No hype or “moon” copy. Risk disclaimer is always visible. Do not place paid ads until Morapay confirms BoG/SEC status.

## License

MIT
