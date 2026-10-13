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

ENV NODE_ENV=production
