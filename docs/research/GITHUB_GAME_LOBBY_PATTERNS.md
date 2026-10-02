# GitHub game lobby patterns

## Sources reviewed
- `colyseus/colyseus-examples`
- community Phaser/Colyseus lobby repositories discovered through GitHub search

## Pattern retained for NEON FUSE
The official Colyseus examples separate lobby discovery from game rooms:
- a dedicated lobby room exposes current room listings;
- realtime listing updates add/update/remove rooms;
- game clients join a chosen game room separately;
- `joinOrCreate` is used for room entry;
- room capacity remains server-side.

## NEON FUSE implication
Future Phase 3 topology:

```
Lobby UI
  -> LobbyRoom / listing
  -> choose/create match
  -> MatchRoom
  -> authoritative simulation
```

The lobby must not own combat simulation or authoritative match outcomes.

## Rejected pattern
Do not use a peer/client host as the authoritative match owner merely to simplify lobby creation. That would conflict with ADR-0002.
