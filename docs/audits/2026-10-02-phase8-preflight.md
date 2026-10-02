# Phase 8 Preflight Audit — 2026-10-02

## Scope
Release hardening after the Phase 7 gameplay merge.

## Findings
1. **Map matchmaking gap:** Colyseus `joinOrCreate("match", { mapId })` does not constrain reuse of existing rooms unless the room handler declares a matchmaking filter.
2. **Room lifecycle UX gap:** the online scene has no explicit player-controlled return to lobby and does not dispose its MatchConnection on scene shutdown.

## External capability verification
Current Colyseus source confirms:
- `defineRoom(...).filterBy(["field"])` is the supported matchmaking filter mechanism.
- filtered creation options are persisted into matchmaking metadata.
- SDK `Room.leave(consented = true)` is the supported clean-leave API.

## Architecture verdict
**No ADR change required.**

Both fixes reinforce existing architecture:
- map selection remains server-side matchmaking policy;
- clean leave is connection lifecycle only and does not affect simulation authority.

## Constraints
- no client map geometry;
- no peer hosting;
- no client-declared player elimination on leave;
- server `onLeave` remains responsible for authoritative roster/round consequences;
- manual leave must not trigger automatic reconnect.
