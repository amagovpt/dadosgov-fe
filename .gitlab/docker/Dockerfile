# Runtime image only: production dependencies and build output come from the
# CI job `package-code` (publish/). NODE_IMAGE in .gitlab-ci.yml must use the
# same base image, since node_modules is installed there.
ARG NEXUS_REGISTRY_PULL_URL=docker.io/library
FROM ${NEXUS_REGISTRY_PULL_URL}/node:24.13.0-alpine3.23
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node publish/ ./
RUN mkdir -p logs && chown node:node logs
USER node
EXPOSE 3333
CMD ["node", "build/server.js"]
