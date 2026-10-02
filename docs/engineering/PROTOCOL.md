# Network Protocol Baseline

## Client → server intents
- `player.move`: direction + input sequence
- `core.place`: requested cell + input sequence
- `match.ready`
- `player.emote` (later)

## Server → client state/events
- authoritative player state
- core placement/removal
- explosions
- block destruction
- pickups
- player eliminated
- phase/timer changes
- round result

## Rules
1. Include a protocol version.
2. Treat all client input as untrusted.
3. Keep messages compact and explicit.
4. Prefer deterministic state/event reproduction for replays later.
5. Do not place commerce secrets or personal data in match protocol messages.
