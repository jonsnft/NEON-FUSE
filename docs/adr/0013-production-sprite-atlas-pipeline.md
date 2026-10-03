# ADR 0013: Production sprite atlas pipeline

## Status
Accepted

## Context
NEON FUSE already had client-only vector presentation and presentation-state helpers for facing, locomotion, fuse urgency and reduced motion. The next art step needs versioned raster assets without moving visual concerns into the authoritative simulation.

## Decision
Use a Phaser atlas loaded from `apps/client/public/assets/neon-fuse-atlas.png` plus TexturePacker-compatible JSON metadata. A `SpriteAtlasLayer` owns persistent tile/entity Images and maps existing presentation state to named frames.

The layer:
- reuses tile Images instead of redrawing tile geometry every frame;
- derives player facing from client-side positional deltas;
- derives core urgency from authoritative `fuseMs`;
- animates pickups and locomotion only when visual preferences allow motion;
- preserves critical fuse progression under reduced motion;
- falls back to `CyberpunkAssetLayer` if the atlas is unavailable.

No atlas frame name, sprite state or animation phase is part of simulation or protocol state.

## Consequences
Art can now be replaced or expanded behind stable frame contracts. More sophisticated hand-authored sprite sheets can be introduced without changing gameplay authority. Persistent Images also reduce per-frame geometry generation compared with the vector production layer.
