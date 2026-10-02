# Phase 2 Preflight Audit — 2026-10-02

## Planned scope
Authoritative online multiplayer using Colyseus 0.17 while reusing the Phase 1 shared simulation unchanged in responsibility.

## Architecture constraints
- ADR-0001: TypeScript + Phaser + Colyseus remains unchanged.
- ADR-0002: server owns competitive outcomes.
- ADR-0003: deterministic grid simulation remains the rule engine.
- ADR-0004: economy remains cosmetic-only and out of gameplay authority.
- ADR-0005: external platform APIs stay behind adapters.

## Server responsibilities
- create/join room lifecycle
- assign stable player/session identity for the room
- validate message shape and allowed directions
- invoke shared `movePlayer`, `placeCore`, `tickSimulation`
- run the fixed simulation loop
- publish authoritative snapshots
- allow bounded reconnection
- reject inputs after round finish

## Client responsibilities
- connect/reconnect
- send movement/core intents
- render server snapshots
- never declare collision, elimination, winner, pickup ownership or core outcome

## State synchronization decision
For Phase 2, use Colyseus Room messaging with versioned full snapshots generated from the canonical shared state. This keeps the shared simulation free of Colyseus Schema classes and prevents transport/framework types from entering the game core.

A future optimization to Schema patch synchronization is permitted only if profiling shows a need; it would remain a transport optimization, not a gameplay architecture change.

## GitHub/Colyseus references
Official `colyseus/colyseus-examples` 0.17 patterns reviewed:
- Room classes with server-side `maxClients`
- `onMessage` input handlers
- `onJoin` / `onLeave`
- `allowReconnection` via `onDrop` / `onReconnect`
- `defineServer` / `defineRoom`
- separate `LobbyRoom` with realtime listings

## Verdict
No ADR change required for the planned implementation.
