FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --no-frozen-lockfile

COPY apps/server apps/server
COPY packages/shared packages/shared

ENV GAME_SERVER_PORT=2567
ENV NEON_FUSE_PLATFORM_MODE=local

EXPOSE 2567

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${GAME_SERVER_PORT}/healthz" >/dev/null || exit 1

CMD ["pnpm", "--filter", "@neon-fuse/server", "start"]
