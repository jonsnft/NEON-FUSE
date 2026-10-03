# ADR 0013: Animated client presentation without gameplay-facing state

## Status
Accepted

## Context
The cyberpunk production asset layer introduced map-specific materials, player silhouettes, Energy Cores, and pickup glyphs as a client-only vector presentation pass. The next visual step requires directional character readability and animation while preserving the server-authoritative simulation boundary.

The simulation exposes player tile positions and Core `fuseMs`, but it intentionally does not expose cosmetic facing or animation state because those values have no gameplay meaning.

## Decision
Animation remains entirely inside the client rendering layer.

- Player facing is inferred from changes between consecutive authoritative target tile positions.
- Idle and movement phases are presentation-only and never sent to the server.
- Energy Core urgency is derived from the existing authoritative remaining `fuseMs`.
- Pickup animation is cosmetic and does not modify pickup state.
- Reduced-motion preferences disable nonessential bobbing, orbiting, and ambient animation while preserving static directional silhouettes and fuse urgency cues.
- Low quality removes secondary detail animation while keeping gameplay-critical shapes and colors.

## Consequences
The simulation, protocol, replay semantics, and platform boundary remain unchanged. Facing may briefly retain the last direction while a player is stationary, which is intentional and visually stable. A future sprite/atlas implementation can replace the procedural drawing behind the same presentation model without adding gameplay state.
