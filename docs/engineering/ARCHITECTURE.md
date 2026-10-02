# Architecture

## System goals
- Deterministic and testable gameplay rules.
- Server authority for competitive state.
- Rendering decoupled from simulation.
- Shared typed protocol.
- Easy browser deployment.
- Platform/economy integrations isolated from core game logic.

## High-level topology

Client (Phaser)
  ↕ network protocol
Authoritative Game Server (Colyseus / Node)
  ↕
Shared deterministic simulation + shared types

Optional external services:
- identity/auth adapter
- commerce/item entitlement adapter
- analytics adapter
- persistence adapter

## Repository layout

- `apps/client`: browser client, presentation, input, interpolation, UI.
- `apps/server`: room lifecycle, matchmaking hooks, authoritative tick, validation.
- `packages/shared`: protocol messages, pure game rules, constants, serializable types.
- `docs`: project memory and ADRs.
- `assets`: source-controlled non-secret game assets.

## Authority boundary
Client may request intent. Client may not declare authoritative outcomes.

Client sends examples:
- move intent
- place-core intent
- emote intent

Server determines:
- legal position
- placement validity
- timers
- explosion cells
- collisions
- pickup results
- deaths
- score
- winner

## Simulation
Use discrete grid coordinates and a fixed server timestep. Avoid general rigid-body physics for the MVP. Rendering may interpolate between authoritative states.

## Security invariants
- No API keys in repository.
- No trust in client-reported inventory/entitlements.
- All paid item entitlements validated server-side or through a trusted platform adapter.
- Input rate limits and validation.
- Version protocol messages.

## Extension points
- Game modes implement a stable rules interface.
- Maps use declarative data, not executable user code.
- Cosmetics use data-driven manifests.
- External platform integrations use adapters.
