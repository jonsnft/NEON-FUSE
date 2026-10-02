# Game Design Baseline

## Working title
NEON FUSE

## Setting
A damaged retro-futuristic network simulation circa 1999. Players are digital avatars fighting for control inside unstable machine grids.

## Match format
- Initial target: 2–4 players during development, 2–8 for MVP.
- Match duration target: 3–5 minutes.
- Fixed-timestep authoritative simulation.

## Inputs
- Move: up/down/left/right.
- Primary action: place Energy Core.
- Optional later actions: kick, remote detonation, emote.

## Grid
Initial reference arena: 15 × 13 cells.

Cell categories:
- Indestructible wall.
- Destructible block.
- Walkable floor.
- Spawn-safe floor.
- Temporary hazard.

## Energy Core
A placed core:
- occupies one grid cell;
- has an owner;
- has a fuse deadline;
- explodes in cardinal directions;
- stops at hard walls;
- destroys one destructible block on impact unless balance rules change;
- can trigger other cores for chain reactions.

## Match power-ups
Temporary and earned inside a match. Never directly sold.
- Range +1
- Core capacity +1
- Speed +1 tier
- Kick
- Remote detonation
- Shield (later)
- Phase (later)

## Elimination
MVP: one hit eliminates the player for the round.

## Sudden death
At a configured time threshold, the playable area contracts or lethal blockers are introduced deterministically until the round resolves.

## Fairness rule
The server is authoritative over movement validity, core placement, fuse time, blast propagation, pickup acquisition, elimination, scoring and winner determination.
