ARG NEXUS_REGISTRY_PULL_URL=nexus.devops.ama.lan:5001

FROM ${NEXUS_REGISTRY_PULL_URL}/node:22.12.0-alpine AS base

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --audit=false

# --- Build stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time configuration for DEV. Anything marked REPLACE-ME must be set to the
# real DEV address before this image is built.
# Client-side API calls stay relative and go through the rewrite proxy.
ENV NEXT_PUBLIC_API_BASE=/api/1
ENV NEXT_PUBLIC_API_V2_BASE=/api/2
# Backend address used by the next.config.ts rewrites (resolved at build time).
ENV BACKEND_URL=http://REPLACE-ME-dev-backend.invalid
# Squidex (CMS) GraphQL endpoint; must be a valid URL, next.config.ts parses it.
ENV NEXT_PUBLIC_API_URL=https://REPLACE-ME-dev-cms.invalid
ENV NEXT_PUBLIC_SAML_ENABLED=true
# reCAPTCHA v3 site key (public). Empty skips reCAPTCHA.
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Production stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# UID/GID match the host `dadosgov` group (10001), as in the root Dockerfile
ARG NEXTJS_UID=10001
ARG NEXTJS_GID=10001
RUN addgroup --system --gid ${NEXTJS_GID} nodejs && \
    adduser --system --uid ${NEXTJS_UID} --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/.next/cache/images && \
    chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
