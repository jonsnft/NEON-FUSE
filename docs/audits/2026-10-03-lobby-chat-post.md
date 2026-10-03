# Lobby Chat Post-Implementation Audit — 2026-10-03

## Compared
`main` -> `feature/lobby-chat`

## Architecture verdict
**No architecture change detected. No ADR revision required.**

## Separation of concerns
Lobby chat uses dedicated Colyseus room message channels:
- client -> `chat.send`
- server -> `chat.message`

It does not use `ClientIntent` and does not enter the shared deterministic simulation.

## Server controls
The authoritative MatchRoom:
- accepts chat only while no match is running;
- validates the versioned envelope;
- trims and bounds text to 160 characters;
- rejects empty/invalid text;
- rate-limits each sender to one accepted message per 750 ms;
- derives `senderId` from the authenticated room connection;
- derives `sentAtMs` from the server clock.

Clients cannot forge another sender ID or timestamp because those fields are not accepted from `chat.send`.

## Client controls
The chat UI is isolated in `LobbyChat`.
- `T` enters chat mode only in waiting state.
- `Enter` sends.
- `Escape` cancels chat entry instead of leaving the lobby while typing.
- Ready/start/gameplay inputs are suppressed while typing.
- Only the latest 8 received messages are rendered locally.
- Message text is rendered as Phaser text; no HTML/markup interpretation is introduced.

## Gameplay invariants
Unchanged:
- room creator controls explicit match start;
- all currently connected players must be ready;
- room capacity remains up to 8;
- gameplay is server-authoritative;
- chat cannot modify readiness, creator identity, maps, player stats, inventory or results.

## Scope deliberately deferred
- persistent history;
- display-name/account system;
- moderation service/profanity filtering;
- private messages;
- in-match chat.

## Merge gate
Merge only after architecture guard, typecheck, tests, build, Compose validation and both Docker image builds pass.
