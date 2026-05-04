FROM node:22-alpine AS base

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js needs NEXT_PUBLIC_* vars at build time
ARG NEXT_PUBLIC_API_BASE=/api/1
ARG NEXT_PUBLIC_API_V2_BASE=/api/2
ARG NEXT_PUBLIC_FRONT_BASE=http://localhost:3000
ARG NEXT_PUBLIC_BASE_URL=https://dados.gov.pt/
ARG NEXT_PUBLIC_STATIC_URL=https://dados.gov.pt/static/
ARG NEXT_PUBLIC_READ_ONLY_MODE=false
ARG NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=true
ARG NEXT_PUBLIC_SAML_ENABLED=true
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_MATOMO_HOST=
ARG NEXT_PUBLIC_MATOMO_SITE_ID=1
ARG NEXT_PUBLIC_API_URL=http://host.docker.internal:3333

# BACKEND_URL is used by next.config.ts rewrites (server-side only)
ARG BACKEND_URL=http://host.docker.internal:7000

RUN npm run build

# --- Production stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
