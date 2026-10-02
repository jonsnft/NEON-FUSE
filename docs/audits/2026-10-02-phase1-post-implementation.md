# Phase 1 Post-Implementation Audit — 2026-10-02

## Compared
`main` → `feature/phase1-offline-core`

## Architecture verdict
**No architecture change detected. No ADR revision required.**

### ADR-0001 Browser-first TypeScript stack
Compliant. Phaser exists only in `apps/client`; pure gameplay state/rules live in `packages/shared`.

### ADR-0002 Server-authoritative multiplayer
Compliant by construction. The current offline Phaser scene is a development harness. Competitive rules are not encoded solely in Phaser and can be invoked by the future Colyseus server.

### ADR-0003 Deterministic grid simulation
Compliant. Movement, blocking, core placement, fuse time, blast propagation, soft-block destruction, pickup reveal and chain reactions are discrete grid rules. No rigid-body physics dependency was introduced.

### ADR-0004 Cosmetic-first economy
Unaffected. The three implemented power-ups are match-earned simulation pickups. No paid power path exists.

### ADR-0005 Platform adapters
Unaffected. No PlayBay/payment/platform contract is imported into game simulation.

## Important implementation invariant discovered
A placed Energy Core snapshots its blast range at placement time. Explosion resolution reads the Core's stored range, not mutable current player state. This is necessary for deterministic future multiplayer and replay behavior.

## GitHub lobby research linkage
The official Colyseus examples support the planned separation:
`LobbyRoom/listing -> chosen MatchRoom -> authoritative simulation`.
This pattern is documented under `docs/research/GITHUB_GAME_LOBBY_PATTERNS.md` and deferred to Phase 3.

## Current Phase 1 coverage
Implemented:
- 15×13 deterministic arena
- local movement
- hard/soft blocks
- Energy Core placement
- fuse and directional blast propagation
- chain reactions
- range/capacity/speed match pickups
- elimination
- local reset harness
- Phaser rendering
- simulation unit tests
- CI definition

Completed after initial audit:
- explicit multiplayer round state with `players[]`, `phase`, `winnerId` and draw handling
- distinct safe spawns for 1–8 players
- per-player movement/core ownership and collision rules

Remaining merge gate:
- final verification via CI/build

Optional follow-up:
- deterministic map fixture expansion

## Merge gate
Do not merge solely because the branch is playable. Merge after CI passes and review confirms the server-authority boundary remains intact.
