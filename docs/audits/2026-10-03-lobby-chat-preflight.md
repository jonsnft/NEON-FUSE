# Lobby Chat Preflight Audit — 2026-10-03

## Scope
Add minimal room-local text chat for players while a MatchRoom is in the waiting/lobby state.

## Architecture verdict
**No ADR change required.**

Chat is deliberately separated from `ClientIntent` and the deterministic simulation.

Topology:

```
Client UI
  -> chat.send (room message)
  -> MatchRoom validation / rate limit
  -> chat.message (broadcast)
  -> waiting-room clients
```

Gameplay remains:

```
ClientIntent
  -> server validation
  -> shared deterministic simulation
```

## Invariants
- Chat is available only while `game === null` (waiting lobby).
- Chat cannot change readiness, creator role, map selection, game state, inventory or entitlements.
- Server is the authority for accepted chat messages.
- Empty/oversized messages are rejected.
- Messages are rate-limited server-side.
- No arbitrary HTML/markup/rendered links are interpreted by the client.
- No persistent history/database is introduced in this step.
- Chat does not enter `packages/shared/src/sim/`.

## Initial limits
- Maximum message length: 160 Unicode code units after trimming.
- Minimum interval per sender: 750 ms.
- Client display keeps only the latest 8 messages.

## Non-goals
- accounts/display-name editing;
- private messages;
- persistence;
- profanity/moderation service;
- in-match chat;
- PlayBay identity integration.
