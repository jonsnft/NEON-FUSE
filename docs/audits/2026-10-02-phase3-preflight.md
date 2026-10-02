# Phase 3 Preflight Audit — 2026-10-02

## Planned scope
Productize multiplayer without changing the accepted gameplay architecture:
- public lobby discovery
- 2–8 player match capacity
- ready gate
- rematch votes
- spectator behavior for eliminated players
- room metadata for discovery

## Architecture constraints
- Lobby may discover rooms but must not own match simulation.
- MatchRoom may own readiness/rematch lifecycle but must delegate gameplay rules to `@neon-fuse/shared`.
- Shared simulation remains transport-agnostic.
- Client never decides readiness of other players, winner, respawn, entitlement, or room authority.
- Monetization remains out of the match lifecycle.

## Colyseus pattern linkage
Official Colyseus 0.17 LobbyRoom behavior reviewed:
- initial room list delivered through `rooms`
- realtime add/update delivered through `+`
- removal delivered through `-`
- realtime-listed rooms expose metadata
- `joinById` supports selecting a listed room

## Lifecycle model
```
LobbyRoom
  -> choose/create MatchRoom
  -> waiting
  -> all connected players ready (minimum 2)
  -> playing
  -> finished / spectators observe
  -> unanimous rematch vote
  -> new round with same connected player IDs
```

## Capacity
MatchRoom supports 2–8 players. The initial room's requested capacity is clamped server-side; no client can exceed the hard limit.

## Verdict
No ADR change required.
