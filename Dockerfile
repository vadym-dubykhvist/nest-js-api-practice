# syntax=docker/dockerfile:1.7
#
# Builds the NestJS API (apps/api) from the pnpm/Nx monorepo.
# Strategy: install + build inside the workspace, then `pnpm deploy` a
# flattened, prod-only bundle so the runtime layout (dist/main.js,
# node_modules, package.json with _moduleAliases) stays identical to the
# pre-monorepo image — the Helm chart needs no changes.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS builder
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
WORKDIR /app

RUN corepack enable

# Workspace + project manifests first for a cacheable install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY libs/shared-types/package.json ./libs/shared-types/package.json
COPY libs/api-client/package.json ./libs/api-client/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prefer-offline --filter @events/api...

# Build the API.
COPY apps/api ./apps/api
RUN pnpm --filter @events/api run build

# Flatten into a prod-only deployable at /app/out (de-symlinked node_modules).
# --legacy: deploy a non-injected workspace (pnpm v10+ requires this opt-in).
RUN pnpm --filter @events/api --prod deploy --legacy /app/out

FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/out ./

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
