# Cyberpunk production asset research

Date: 2026-10-03
Status: Pre-implementation research

## Goal
Move NEON FUSE from procedural prototype shapes to a coherent, versioned production-art vocabulary for players, arena tiles, Energy Cores, pickups and map-specific materials without changing simulation semantics.

## External references
- Phaser supports reusable image/texture workflows suitable for modular sprite and tile assets.
- Contemporary cyberpunk pixel-art packs commonly use strict modular grids, a locked palette, repeated material motifs and high-contrast silhouettes. These are workflow references only; no third-party art is copied into NEON FUSE.
- Readability remains a primary constraint: gameplay-relevant silhouettes must remain visually separable under glow, CRT and chromatic effects.

## NEON FUSE decisions
1. Build an original vector-sprite/tile kit in code as version-controlled source art. This avoids license ambiguity and gives deterministic scaling at the existing 48 px gameplay grid.
2. Use a shared material vocabulary: dark plated metal, cyan conduits, magenta data seams, amber hazard accents and high-value white cores.
3. Give each official map a material identity without changing collision geometry:
   - `grid-zero`: cyan diagnostic grid / clean simulation chamber;
   - `data-cross`: magenta data-bus seams / routing-node motifs;
   - `switchyard`: amber industrial switching / hazard-strip motifs.
4. Player sprites use a readable armored-digital silhouette with a bright visor/core; cosmetic tinting remains presentation-only.
5. Energy Cores and pickups retain shape coding in addition to color so they remain distinguishable under bloom and reduced color perception.
6. Keep the existing NeonWorldRenderer FX layer intact. The production asset layer is a separate client-only renderer; gameplay never reads back from it.

## First production asset set
- hard tile, soft tile and floor tile treatments for all three official maps;
- player chassis with cosmetic tint and self marker;
- Energy Core shell;
- range / capacity / speed pickup glyphs;
- map-specific floor conduits and material marks.

## Deferred
- hand-authored animation sheets;
- directional walk cycles;
- character archetype skins;
- high-resolution promotional art;
- texture-atlas packing;
- decorative props beyond gameplay tiles.

## Validation criteria
- no shared/server/protocol changes;
- all official maps render a distinct material identity;
- entities remain readable at LOW/MEDIUM/HIGH visual quality;
- asset layer can be removed without changing match outcome;
- full CI and release container builds remain green.
