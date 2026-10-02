# Server

Colyseus/Node authoritative server.

## Responsibilities
- Own MatchRoom lifecycle and capacity.
- Validate protocol payloads and monotone input sequences.
- Invoke the shared deterministic simulation.
- Advance the server tick.
- Publish canonical snapshots.
- Provide bounded reconnection.

## Non-responsibilities
The server package does not duplicate game rules. Movement legality, core placement, explosions, pickups, elimination and winner resolution live in `@neon-fuse/shared`.
