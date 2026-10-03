# Lobby configuration preflight audit

Date: 2026-10-03
Branch: `feature/lobby-config`

## Scope
Introduce creator-controlled, server-authoritative lobby configuration for:
- player capacity (2–8),
- official map,
- item preset,
- modifier preset.

## Research gate
Completed before implementation:
- open-source server-authoritative lobby reference,
- CHI 2026 rule-changing/player-authorship research,
- competitive multiplayer difficulty-adjustment research.

See `docs/research/2026-10-03-lobby-configuration.md`.

## Architecture gate
ADR 0006 records the durable contract:
- server owns accepted configuration,
- creator-only changes while waiting,
- Ready votes reset after accepted rule changes,
- map is no longer a matchmaking filter,
- selected rules are copied into GameState.

## Implementation boundary
Changed domains:
- shared lobby/rule contracts,
- MatchRoom waiting-state authority,
- room metadata and browser display,
- creator lobby controls,
- item preset arena creation,
- sudden-death modifier handling,
- tests and documentation.

Explicitly unchanged:
- player movement authority,
- core placement/explosion semantics,
- cosmetics/economy,
- PlayBay adapter boundary,
- creator map validation,
- chat authority model.

## Required verification
- architecture guard,
- typecheck,
- unit tests,
- real Colyseus runtime test,
- production client build,
- Compose validation,
- server image build,
- client image build.
