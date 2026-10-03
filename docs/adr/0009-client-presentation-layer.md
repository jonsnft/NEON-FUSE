# ADR 0009: Client presentation layer for cyberpunk rendering

Date: 2026-10-03
Status: Accepted

## Context
NEON FUSE currently renders authoritative `GameState` directly into a Phaser `Graphics` object when snapshots arrive. This is sufficient for correctness but produces prototype-like visuals and makes online movement appear discrete because network state arrives at a lower cadence than the display refresh rate.

The project requires a cyberpunk/retro-future art direction that feels dynamic and fluid while preserving the server-authoritative simulation boundary.

## Decision
Introduce a client-only presentation layer between `GameState` and Phaser drawing.

The presentation layer:
- accepts authoritative snapshots as targets;
- owns visual-only interpolation state;
- renders continuously at the client frame rate;
- may own pulse, glow, scan, trail and impact state;
- must not mutate `GameState`;
- must not feed presentation coordinates or visual timing back into gameplay intents;
- must remain replaceable by future sprite/shader-based rendering.

Phase 1 uses normal Phaser Graphics and low-cost procedural effects. GPU post-processing is deferred into an optional quality tier.

## Consequences

### Positive
- online movement can be visually smooth without changing server tick or collision rules;
- art direction is centralized instead of distributed through scenes;
- later sprites, particles and shaders can be added without changing simulation contracts;
- low-end clients can retain a non-shader rendering path;
- gameplay remains deterministic and server authoritative.

### Negative
- the client now has two notions of position: authoritative tile position and presentation position;
- renderer lifecycle must be explicitly managed on scene shutdown;
- visual interpolation intentionally means the screen may briefly show an in-between location that is not a valid simulation tile.

## Invariants
- authoritative state wins immediately for gameplay decisions;
- visual interpolation is never used for hit detection, collision, placement or networking;
- critical objects retain stable, high-contrast silhouettes;
- optional atmospheric FX must be disableable independently from gameplay rendering.

## Related research
`docs/research/2026-10-03-cyberpunk-presentation-and-motion.md`