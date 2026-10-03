# Animated character art research — 2026-10-03

## Goal
Advance the cyberpunk production layer from static vector silhouettes to readable animation states without weakening server authority or reduced-motion support.

## Existing constraints
- Authoritative simulation exposes discrete player tile positions, Core `fuseMs`, pickup state, and match state.
- Facing has no gameplay meaning and should not be added to simulation state.
- Rendering already interpolates player positions client-side.
- Visual quality tiers are `low`, `medium`, and `high`.
- Reduced motion must remove nonessential ambient motion while retaining gameplay readability.

## Chosen presentation model
1. Infer four-direction facing from changes in authoritative target tile coordinates.
2. Retain the last facing while stationary.
3. Add small procedural idle and movement offsets rather than changing collision or input timing.
4. Derive Energy Core urgency directly from remaining `fuseMs`, increasing pulse frequency and ring emphasis as detonation approaches.
5. Animate pickup glyph geometry and optional orbit markers only on motion-enabled / non-low configurations.
6. Keep critical color + shape coding static so reduced-motion users lose no gameplay information.

## Future atlas migration
The current vector layer remains a useful stable presentation boundary. A later atlas/sprite-sheet pass can map the same facing and movement states to frames without changing network or simulation data.
