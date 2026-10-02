# Phase 8 Post-Implementation Audit — 2026-10-02

## Compared
`main` -> `feature/phase8-release-hardening`

## Architecture verdict
**No architecture change detected. No ADR revision required.**

## Matchmaking correctness
The official Colyseus `RegisteredHandler.filterBy()` mechanism is now used with `mapId`.

Result:
- `joinOrCreate("match", { mapId })` reuses only a compatible map room;
- the server continues to normalize the room's map ID in `MatchRoom`;
- clients still cannot submit map geometry.

## Connection lifecycle
`MatchConnection.disconnect()` uses the verified SDK API `Room.leave(true)`.

Manual leave behavior:
- sets a manual-leave flag;
- disables reconnect;
- clears the active room reference;
- releases callback references;
- does not emit a post-shutdown disconnect UI callback.

Unexpected disconnect behavior:
- clears stale room reference;
- retains bounded reconnect attempts;
- aborts reconnect immediately if a manual leave begins.

## Scene lifecycle
The online game scene:
- provides `ESC = LOBBY` in waiting/playing/finished states;
- disconnects the room on Phaser scene shutdown;
- leaves authoritative leave consequences to MatchRoom.

## Authority audit
No client-declared elimination, winner, room result or map geometry was introduced.

## External dependency audit
No new runtime dependency was added.
Colyseus behavior used here was verified against the current upstream source.

## Merge gate
Merge only after typecheck, tests and production build pass.
