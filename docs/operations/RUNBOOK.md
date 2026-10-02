# NEON FUSE Operations Runbook

## Runtime topology

```
Browser / Phaser client
        |
        | HTTP matchmaking + WebSocket game traffic
        v
Colyseus / Node game server
        |
        +-- LobbyRoom
        +-- MatchRoom
        +-- /healthz
        |
        +-- PlatformServices
              |
              +-- local (available)
              +-- playbay (fail-closed until contract is verified)
```

## Local development

Install dependencies:

```bash
pnpm install
```

Start the authoritative game server:

```bash
GAME_SERVER_PORT=2567 NEON_FUSE_PLATFORM_MODE=local pnpm --filter @neon-fuse/server dev
```

Start the browser client in another terminal:

```bash
VITE_GAME_SERVER_URL=http://localhost:2567 pnpm --filter @neon-fuse/client dev
```

The client default is also `http://localhost:2567`.

## Health check

```bash
curl -fsS http://localhost:2567/healthz
```

Expected shape:

```json
{
  "ok": true,
  "service": "neon-fuse",
  "platformMode": "local"
}
```

The endpoint intentionally exposes no secrets, balances, account IDs or player data.

## Verification before release

Run from the repository root:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Release must be blocked if any of these fail.

## Multiplayer smoke test

1. Start one server and two browser clients.
2. Both clients enter the lobby.
3. Create/join the same room.
4. Confirm the room list exposes the server-selected map.
5. Both players ready.
6. Confirm movement and Energy Core placement are authoritative.
7. Confirm one client cannot move through hard/soft blocks, players or cores.
8. Confirm blast elimination is reflected on both clients.
9. Confirm the timer counts down from four minutes.
10. Confirm Sudden Death starts at three minutes and contracts deterministically.
11. Confirm winner/draw state.
12. Confirm unanimous rematch produces a fresh round on the same map.
13. Disconnect/reconnect one client during a round and verify recovery.
14. Confirm cosmetics only alter presentation.

## Environment

### Server

- `GAME_SERVER_PORT` — integer 1..65535; default 2567.
- `NEON_FUSE_PLATFORM_MODE` — `local` today. `playbay` intentionally fails closed until the external contract is verified.

### Client build

- `VITE_GAME_SERVER_URL` — Colyseus endpoint included in the browser build.

Do not put secrets in any `VITE_*` variable; Vite client variables are public.

## PlayBay production gate

Production PlayBay mode must not be enabled until `docs/integrations/PLAYBAY_VERIFICATION.md` is satisfied by authoritative documentation.

Do not infer production URLs, auth headers, webhook signatures, entitlement schemas or purchase semantics from marketing pages or unrelated services.

## Incident priorities

1. Disable new match admission if authoritative state integrity is uncertain.
2. Preserve logs/room identifiers without leaking credentials or private player data.
3. Keep platform purchases/entitlements fail-closed rather than granting unverified ownership.
4. Do not compensate a network failure by trusting client-reported match outcomes.
5. Fix the shared simulation or server adapter, then add a regression test before redeploying.
