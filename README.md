# NEON FUSE

NEON FUSE is a browser-first, server-authoritative multiplayer arena game inspired by the fast, readable grid-based party games of the 1980–2001 era, while using an original IP, original art direction, original world, original characters, and original content.

## Status

The repository is internally release-candidate ready in `local` platform mode. CI verifies the architecture guard, typecheck, unit/runtime tests, production build, Compose configuration, and both release container builds.

Real PlayBay identity, commerce and entitlement integration remains intentionally fail-closed until an authoritative platform contract is available.

## Product thesis

- 2–8 players for the first public release.
- 3–5 minute bounded matches with deterministic Sudden Death.
- Grid movement, timed energy cores, directional blasts, destructible blocks, pickups and chain reactions.
- Fair competitive gameplay: monetization is cosmetic-first and must not buy combat power.
- Browser-first distribution with a compact, low-friction onboarding loop.
- PlayBay-ready item catalog and creator economy, with platform-specific behavior isolated behind adapters.

## Technical baseline

- TypeScript
- Phaser for browser game rendering and input
- Colyseus for authoritative multiplayer rooms/state synchronization
- Node.js server runtime
- Vite for client development/build
- Shared protocol/types package
- Deterministic grid simulation independent from rendering
- Docker/Compose release packaging

## Quick local release smoke test

```bash
docker compose build
docker compose up
```

Open `http://localhost:8080` and verify server health at `http://localhost:2567/healthz`.

For source-based development and the complete multiplayer smoke checklist, see `docs/operations/RUNBOOK.md`. For container configuration, see `docs/operations/CONTAINERS.md`.

## Verification

```bash
pnpm install
pnpm architecture:guard
pnpm typecheck
pnpm test
pnpm build
docker compose config
```

See `docs/` for architectural decisions, audits, creator-content contracts, platform verification requirements and operations documentation.
