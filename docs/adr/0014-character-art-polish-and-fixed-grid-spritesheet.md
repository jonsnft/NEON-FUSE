# ADR 0014: Character art polish on fixed-grid spritesheet

## Status
Accepted

## Context
The first production atlas established a persistent Phaser image layer but only provided one idle and one move frame per facing direction. Character presentation still read as prototype motion, avatar cosmetics were mostly tint-based, new Energy Cores appeared without a placement beat, and eliminated players disappeared immediately.

## Decision
Use one versioned 48x48 fixed-grid spritesheet as the production character/material source. Keep all frame indexing in `spriteAtlas.ts` so runtime behavior is explicit and unit-testable.

The sheet contains:
- three avatar art variants: cyan, lime and ghost;
- two idle frames and four walk frames for each of four facing directions;
- four elimination frames per avatar variant;
- three Energy Core placement frames plus four fuse-urgency frames;
- existing map tile and pickup frames.

`SpriteAtlasLayer` remains presentation-only. Facing is inferred from authoritative position changes. Elimination timing is inferred from the alive-state transition. Core placement timing is local presentation timing triggered when a new authoritative core first appears.

Reduced motion and LOW quality freeze locomotion/ambient frame cycling. Critical state remains readable: eliminated players use a static elimination frame briefly, and Core fuse urgency continues to use static urgency frames.

## Consequences
- Character animation can improve without touching simulation or protocol types.
- Cosmetic avatar identity is encoded directly in artwork rather than only tinting one sprite.
- Fixed-grid loading removes the need for a large runtime atlas-coordinate JSON file while preserving deterministic frame contracts.
- The sheet grows to 106 frames, but persistent Phaser images keep per-frame geometry work bounded.
- Future authored art can replace the generated sheet as long as the frame-index contract is preserved or versioned.
