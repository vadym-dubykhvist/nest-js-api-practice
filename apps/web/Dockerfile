# syntax=docker/dockerfile:1.7
#
# Builds the Next.js web app (apps/web) from the pnpm/Nx monorepo into a
# standalone server image. The API base URL is NOT baked in — it is read from
# the runtime env `API_URL` (see app/api/[...path]/route.ts), so the same image
# points at localhost locally and at the in-cluster API Service when deployed.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS builder
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN corepack enable

# Workspace + project manifests first for a cacheable install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY libs/shared-types/package.json ./libs/shared-types/package.json
COPY libs/api-client/package.json ./libs/api-client/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prefer-offline --filter @events/web...

# Sources (workspace libs are transpiled by Next via transpilePackages).
COPY libs ./libs
COPY apps/web ./apps/web
# Cache Next.js' incremental compilation cache across builds (not baked into
# the image — it's a build-only mount), so rebuilds after a code change reuse
# unchanged compilation work instead of recompiling from scratch.
RUN --mount=type=cache,id=next-cache,target=/app/apps/web/.next/cache \
    pnpm --filter @events/web build

FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

# Next standalone output is traced from the monorepo root, so the server entry
# lands at apps/web/server.js with a self-contained node_modules at the root.
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/web/server.js"]
