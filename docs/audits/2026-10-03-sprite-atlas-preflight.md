# Sprite atlas preflight — 2026-10-03

## Scope
Move the production presentation path from per-frame vector drawing to versioned sprite-atlas assets for tiles, players, Energy Cores and pickups.

## Constraints
- no gameplay, simulation or protocol changes;
- preserve server authority;
- preserve LOW/MEDIUM/HIGH quality settings and reduced motion;
- keep a vector fallback if the atlas fails to load;
- avoid per-frame creation/destruction of tile objects;
- retain existing `NeonWorldRenderer` effects pass during this phase.

## Risk checks
- atlas frame names must remain deterministic and covered by tests;
- scene preload must happen before `SpriteAtlasLayer` construction;
- revealed/disappearing pickups and detonated Cores must clean up sprite objects;
- player facing remains presentation-only and must not leak into shared state;
- reduced motion must freeze nonessential frame cycling while retaining fuse urgency.
