# Network Protocol Baseline

## Transport
Colyseus Room messages carry versioned lifecycle/gameplay intents and authoritative snapshots.

## Client → server intents
- `player.move`: monotone input sequence + direction
- `core.place`: monotone input sequence; the server derives the placement cell from canonical player state
- `match.ready`: boolean ready state while the room is waiting
- `match.rematch`: rematch vote after a finished round

## Server → client snapshots

### Waiting
Contains:
- connected player count
- minimum required players
- room maximum players
- ready player IDs

### Playing
Contains the authoritative `GameState`.

### Finished
Contains:
- authoritative final `GameState`
- rematch voter IDs

## Rules
1. Include a protocol version.
2. Treat all client input as untrusted.
3. Movement/core requests are intents, never outcomes.
4. The server derives competitive positions/outcomes from canonical state.
5. Sequence numbers must be monotone per player for gameplay input.
6. Lifecycle votes are scoped to the currently connected room roster.
7. Lobby discovery does not own gameplay state.
8. Keep messages compact and explicit.
9. Do not place commerce secrets or personal data in match protocol messages.

## Lobby discovery
The built-in Colyseus `LobbyRoom` receives realtime-listed MatchRooms. Clients use the initial `rooms` list and `+` / `-` updates, then enter the selected MatchRoom using `joinById` or quick-match using `joinOrCreate`.

## State synchronization
Full versioned snapshots are currently published at the authoritative room tick cadence. This keeps Colyseus schema/transport concerns outside the shared simulation. Patch/delta optimization may be introduced later only as a transport optimization after profiling.
