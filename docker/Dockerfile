ARG NEXUS_REGISTRY_PULL_URL
FROM $NEXUS_REGISTRY_PULL_URL/devops-common/node:24.21.0-alpine

WORKDIR /app

COPY .next/standalone ./
COPY public ./public
COPY .next/static ./.next/static

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

CMD ["node", "server.js"]