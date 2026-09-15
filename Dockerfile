# MP4toURL — Docker (Dokploy-friendly), patterned after editstamp
# BuildKit cache speeds repeat builds: DOCKER_BUILDKIT=1 docker build ...
#
# R2 / Stripe / DB secrets: inject via Dokploy «Environment» at runtime.
# R2: R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL
# MySQL: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# Do NOT put R2_* / STRIPE_SECRET_* / DB_PASSWORD in Build Arguments.
#
# Build-time: set NEXT_PUBLIC_* (and anything required by `next build`).

# ========== Stage 1: deps (skip postinstall until source is present) ==========
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ========== Stage 2: build ==========
FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ARG NEXT_PUBLIC_DEMO_WEBSITE
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
ARG NEXT_PUBLIC_STRIPE_PRICE_LIFETIME
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG RESEND_API_KEY
ARG RESEND_FROM_EMAIL
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=$NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ENV NEXT_PUBLIC_DEMO_WEBSITE=$NEXT_PUBLIC_DEMO_WEBSITE
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=$NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=$NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
ENV NEXT_PUBLIC_STRIPE_PRICE_LIFETIME=$NEXT_PUBLIC_STRIPE_PRICE_LIFETIME
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
ENV GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run postinstall
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm build

# ========== Stage 3: run ==========
# Runtime secrets (DB_*, R2_*, STRIPE_*, OAuth, Resend, …)
# come from Dokploy Environment — not baked into the image.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
