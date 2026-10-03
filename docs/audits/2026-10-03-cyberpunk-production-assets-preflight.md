# Cyberpunk production assets preflight audit

Date: 2026-10-03
Branch: `feature/cyberpunk-production-assets`

## Scope
- original client-side vector tile/sprite vocabulary;
- distinct materials for `grid-zero`, `data-cross`, `switchyard`;
- player, Core and pickup visual assets;
- integration into offline and online game scenes;
- no gameplay, protocol, server, economy or entitlement changes.

## Architecture boundary
The new layer consumes authoritative state but never feeds information back into simulation or input generation. Removing the layer must leave match outcomes unchanged.

## Readability constraints
- hard/soft/floor remain shape- and material-distinct;
- players remain higher-contrast than floor materials;
- Cores remain clearly circular/energy-coded;
- pickups use unique glyph shapes in addition to color;
- transient blast cells from the existing FX renderer remain visually dominant during danger windows.

## Performance constraints
- one additional Phaser Graphics object;
- no per-tile GameObjects;
- no physics-backed art objects;
- no mandatory shader/postFX change;
- deterministic drawing bounded by arena/entity counts already present in `GameState`.

## Verification gate
Architecture guard, typecheck, tests, production build, Compose validation and both Docker images must pass before merge.
