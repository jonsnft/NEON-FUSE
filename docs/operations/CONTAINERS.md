# Container Packaging

## Purpose

These containers reproduce the existing NEON FUSE deployment boundary. They do not define a cloud provider and do not change game architecture.

- `deploy/server.Dockerfile`: authoritative Colyseus/Node server.
- `deploy/client.Dockerfile`: static Vite browser build served by nginx.
- `compose.yaml`: local full-stack release smoke environment.

## Local full-stack build

```bash
docker compose build
docker compose up
```

Then open:

```text
http://localhost:8080
```

Server health:

```bash
curl -fsS http://localhost:2567/healthz
```

## Client endpoint is build-time public configuration

The browser client embeds `VITE_GAME_SERVER_URL` during its Vite build.

Local Compose uses:

```text
http://localhost:2567
```

For a deployed client image, rebuild the client with the externally reachable game-server endpoint:

```bash
docker build \
  -f deploy/client.Dockerfile \
  --build-arg VITE_GAME_SERVER_URL=https://game.example.invalid \
  -t neon-fuse-client .
```

The example hostname above is intentionally non-production. Replace it with the real deployment endpoint.

Never pass secrets through `VITE_*`; browser build variables are public.

## Server runtime

```bash
docker build -f deploy/server.Dockerfile -t neon-fuse-server .
docker run --rm \
  -e GAME_SERVER_PORT=2567 \
  -e NEON_FUSE_PLATFORM_MODE=local \
  -p 2567:2567 \
  neon-fuse-server
```

Production PlayBay mode remains unavailable until the contract gate in `docs/integrations/PLAYBAY_VERIFICATION.md` is satisfied.

## Deployment boundary

The two-image layout is intentional:

```text
static web origin
      |
      v
browser client
      |
      v
public Colyseus endpoint
```

A hosting platform may place TLS, load balancing, CDN and domain routing around this layout without moving game authority into the client.
