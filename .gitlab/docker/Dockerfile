ARG NEXUS_REGISTRY_PULL_URL=nexus.devops.ama.lan:5001

FROM ${NEXUS_REGISTRY_PULL_URL}/node:24.21.0-alpine AS base

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./

# --- Build stage ---
FROM base AS builder
WORKDIR /app
COPY . .

ENV NODE_ENV=production
