# Next.js standalone on Railway / any Node host
FROM node:22-alpine AS deps
WORKDIR /app
# Pin pnpm 10 to match CI / avoid pnpm 12 release-age rejects.
RUN npm install -g pnpm@10
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG MORAPAY_API_BASE=https://api.morapay.io
ARG SHOP_ID=theafricanmeme
ARG NEXT_PUBLIC_SITE_URL=https://token-shop-production-ecd0135d.up.railway.app
ENV MORAPAY_API_BASE=$MORAPAY_API_BASE
ENV SHOP_ID=$SHOP_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
