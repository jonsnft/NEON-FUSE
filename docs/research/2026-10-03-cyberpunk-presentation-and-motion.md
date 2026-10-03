# Cyberpunk presentation and motion research

Date: 2026-10-03
Status: Applied to presentation-layer phase 1

## Goal
Move NEON FUSE from prototype/debug rendering toward a distinctive cyberpunk/retro-future atmosphere that feels dynamic, alive and fluid without obscuring competitive readability or coupling visuals to authoritative game logic.

## Sources reviewed

### Phaser rendering / FX documentation
1. Phaser PostFXPipeline documentation: https://docs.phaser.io/api-documentation/3.88.2/class/renderer-webgl-pipelines-postfxpipeline
   - Post-processing is intended for bloom, blur, light and color manipulation after normal rendering.
2. Phaser FX concepts: https://docs.phaser.io/phaser/concepts/fx
   - Built-in WebGL FX include bloom, glow, color matrix, displacement, vignette and related effects.
3. Phaser RetroZone article: https://phaser.io/news/2026/03/retrozone-open-source-retro-display-engine-phaser
   - Useful reference for bright vector forms on dark backgrounds, additive light treatment, glow hierarchy, scanlines and phosphor-like trails.

### Visual references
4. GRIDbeat launch imagery / interface reference.
   - Strong dark-field grid, cyan/magenta signal paths, compact HUD framing and high-contrast data nodes.
5. Devastator visual reference.
   - Neon grid arena, bright event bursts and particles layered over a legible playfield.
6. Absorber visual reference.
   - Restrained tactical grid with cybernetic framing and clear separation between arena information and surrounding ambience.

These are mood/interaction references only. NEON FUSE must not reproduce another game's assets, layouts, logos, typography or protected characters.

## Findings

### Cyberpunk atmosphere is a system, not a palette
The desired look needs multiple coordinated layers:
- near-black / blue-black base;
- restrained cyan/magenta/acid-yellow signal colors;
- emissive edges and bright cores surrounded by dimmer halos;
- persistent but low-contrast grid/circuit structure;
- micro-motion such as pulse, shimmer, scan movement and trails;
- event-weighted motion: explosions may be energetic, ordinary floor tiles should not compete for attention;
- machine-like HUD language rather than generic rounded web UI.

### Fluidity must be presentation-side
The server remains authoritative at roughly 20 Hz. Rendering directly at snapshot positions produces visually discrete jumps. Smoothness should be produced by a client presentation state that interpolates toward authoritative positions every render frame. This presentation state must never be sent back to the server or used for collision/gameplay decisions.

### Readability takes priority over spectacle
The player, cores, blasts, pickups, hard walls and soft walls need stable silhouettes. Ambient scanlines, glow and particles should be lower contrast than gameplay-critical objects. Effects should become stronger around events (core placement, blast, sudden death) rather than permanently saturating the screen.

### Shader/post-FX should be a quality tier, not a baseline dependency
Phaser supports glow/bloom/post-processing, but these are WebGL-dependent and add fill-rate/shader cost. Phase 1 therefore creates the presentation architecture and procedural neon look with normal Phaser rendering. A later quality tier can add optional bloom/CRT distortion after performance measurement.

## Phase 1 design

1. Introduce a client-only `NeonWorldRenderer`.
2. Renderer owns presentation positions and interpolates players toward authoritative tile targets.
3. Renderer redraws every frame so pulse/glow/scan motion is continuous even if snapshots arrive at 20 Hz.
4. Establish an art-direction token file for palette, glow hierarchy and motion constants.
5. Add low-cost ambient background/grid/scan motion.
6. Give gameplay objects layered silhouettes:
   - floor: low-contrast cyan grid;
   - hard block: dense dark mass with cold edge;
   - soft block: warmer/magenta data-block treatment;
   - player: bright inner core + colored body + halo;
   - Energy Core: pulsing magenta/cyan ring;
   - blast: white-hot center with cyan/magenta energy envelope;
   - pickups: shape-coded as well as color-coded.
7. Preserve existing cosmetics as palette/token modifiers.

## Deferred
- imported final sprite/texture asset set;
- custom fonts;
- GPU bloom / CRT barrel distortion / chromatic aberration;
- camera shake and impact freeze;
- trails/particle emitters tied to semantic events;
- accessibility quality controls and reduced-motion setting;
- full lobby/store visual redesign.

## Performance constraints
- no gameplay object may create unbounded particles or persistent per-frame allocations proportional to match duration;
- interpolation is visual only;
- use one retained Graphics surface for the arena in phase 1;
- visual frame updates may run at display refresh rate while authoritative state remains unchanged;
- later FX tiers must be independently disableable.

## Success criteria
- movement appears continuous rather than jumping from tile snapshot to tile snapshot;
- arena reads immediately at a glance;
- cyberpunk atmosphere is visible even when nothing explodes;
- explosions and cores feel energetic without hiding player position;
- no changes to shared simulation/server authority;
- client typecheck/build/container gates remain green.