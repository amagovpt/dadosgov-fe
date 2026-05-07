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

# Next.js needs NEXT_PUBLIC_* vars at build time — values come from docker-compose build.args
ARG NEXT_PUBLIC_API_BASE=
ARG NEXT_PUBLIC_API_V2_BASE=
ARG NEXT_PUBLIC_FRONT_BASE=
ARG NEXT_PUBLIC_BASE_URL=
ARG NEXT_PUBLIC_STATIC_URL=
ARG NEXT_PUBLIC_READ_ONLY_MODE=
ARG NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=
ARG NEXT_PUBLIC_SAML_ENABLED=
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_API_URL=

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
