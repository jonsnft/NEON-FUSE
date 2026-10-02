FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-workspace.yaml ./
COPY apps/client/package.json apps/client/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --no-frozen-lockfile

COPY apps/client apps/client
COPY packages/shared packages/shared

ARG VITE_GAME_SERVER_URL=http://localhost:2567
ENV VITE_GAME_SERVER_URL=${VITE_GAME_SERVER_URL}

RUN pnpm --filter @neon-fuse/client build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
