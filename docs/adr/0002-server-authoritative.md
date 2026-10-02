# ADR 0002: Server-authoritative multiplayer

Status: Accepted

## Decision
All competitive gameplay outcomes are authoritative on the server.

## Rationale
This limits client cheating, centralizes deterministic rules and creates a stable foundation for ranked play, replays and anti-abuse controls.

## Consequences
- Clients submit intent rather than outcomes.
- Simulation must run headlessly.
- Latency handling requires interpolation/prediction where appropriate.
