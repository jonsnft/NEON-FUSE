# Network Protocol Baseline

## Transport
Colyseus Room messages carry versioned gameplay intents and authoritative snapshots.

## Client → server intents
- `player.move`: input sequence + direction
- `core.place`: input sequence; the server derives the placement cell from canonical player state
- `match.ready`: reserved for lobby/ready flow

## Server → client snapshots
- waiting status with connected/required player counts
- authoritative `GameState` snapshots while playing/finished

## Rules
1. Include a protocol version.
2. Treat all client input as untrusted.
3. Movement/core requests are intents, never outcomes.
4. The server derives competitive positions/outcomes from canonical state.
5. Sequence numbers must be monotone per player to reject stale/replayed gameplay input.
6. Keep messages compact and explicit.
7. Prefer deterministic state/event reproduction for replays later.
8. Do not place commerce secrets or personal data in match protocol messages.

## Phase 2 transport choice
Phase 2 publishes full versioned snapshots at the authoritative room tick cadence. This intentionally keeps Colyseus transport/schema concerns out of the shared simulation. Patch/delta optimization may be introduced later only as a transport optimization after profiling.
