# NEON FUSE

NEON FUSE is a browser-first, server-authoritative multiplayer arena game inspired by the fast, readable grid-based party games of the 1980–2001 era, while using an original IP, original art direction, original world, original characters, and original content.

## Status

The repository is internally release-candidate ready in `local` platform mode. CI verifies the architecture guard, typecheck, unit/runtime tests, production build, Compose configuration, and both release container builds.

Real PlayBay identity, commerce and entitlement integration remains intentionally fail-closed until an authoritative platform contract is available.

## Product thesis

- 2–8 players for the first public release.
- 3–5 minute bounded matches with deterministic Sudden Death by default.
- Grid movement, timed energy cores, directional blasts, destructible blocks, pickups and chain reactions.
- Fair competitive gameplay: monetization is cosmetic-first and must not buy combat power.
- Browser-first distribution with a compact, low-friction onboarding loop.
- PlayBay-ready item catalog and creator economy, with platform-specific behavior isolated behind adapters.

## Waiting lobby

The room creator controls the authoritative waiting-room configuration. Current supported controls are:

- `M` — cycle official map.
- `P` — cycle room player capacity between the current minimum and 8.
- `I` — cycle item preset (`standard`, `no-speed`, `no-items`).
- `G` — cycle modifier preset (`standard`, `no-sudden-death`).
- `F` — cycle pace preset (`standard`, `tactical`). `standard` keeps the tested 1800 ms Core fuse; `tactical` uses 2400 ms for a larger reaction/planning window.
- `R` — Ready / Unready.
- `T` — lobby chat.
- `Enter` — creator starts only when every currently connected player is Ready and at least two players are present.

An accepted creator configuration change clears every Ready vote. Ready therefore means acceptance of the exact rules currently displayed. The creator may start with fewer players than the room maximum when every present player is Ready, or keep waiting for additional players.

Clients select only allowlisted preset IDs. Raw fuse milliseconds are not accepted from clients; Core timing is resolved from the authoritative `GameState.rules`.

## Balance baselines

Official maps expose deterministic balance metrics through the shared `analyzeArenaBalance()` helper. Tests currently lock:

- hard / soft / floor tile counts;
- soft-block ratio of potential traversable space;
- immediate floor egress from each spawn;
- minimum pairwise Manhattan spawn distance.

These are regression/reference metrics for research and playtesting, not claims that one map density is universally optimal.

## Game-design governance

Material changes to gameplay, lobby rules, maps, items, match flow, creator content or economy-adjacent behavior follow a research-first repository workflow:

1. review relevant primary documentation, credible studies and/or maintained open-source references;
2. record findings and uncertainty under `docs/research/`;
3. record durable architecture/data-model decisions as ADRs when appropriate;
4. implement the smallest coherent change;
5. pass architecture, type, test, build and packaging gates;
6. record a post-audit.

The complete policy is `docs/engineering/GAME_DESIGN_CHANGE_POLICY.md`. GitHub is the canonical record for NEON FUSE architecture, game rules and implementation rationale.

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

See `docs/` for research notes, architectural decisions, audits, creator-content contracts, platform verification requirements and operations documentation.
