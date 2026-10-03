# Character art polish preflight — 2026-10-03

## Scope
Polish the production sprite presentation without modifying simulation, server authority or network protocol.

## Planned changes
- expand the production sheet from simple idle/move frames to two idle plus four walk frames per direction;
- add cyan/lime/ghost authored palette variants in the sheet;
- add elimination frames driven by the existing `alive` transition;
- add Core placement frames driven by first observation of an authoritative core;
- preserve fuse urgency from `core.fuseMs`;
- preserve persistent image reuse and tile caching;
- preserve LOW quality and reduced-motion behavior;
- strengthen frame-contract tests.

## Risk checks
- No new fields in `GameState`, `SimPlayer`, `SimCore`, protocol messages or Colyseus state.
- No client animation state may affect movement, collision, damage or Core timing.
- Dead-player presentation must not keep the player logically alive.
- Placement animation must never delay or alter Core simulation.
- Frame mapping must stay within the 106-frame sheet bounds.
- Existing vector presentation remains available as fallback when the production texture is unavailable.

## Acceptance gate
Architecture guard, typecheck, tests, production build, Compose validation, server Docker build and client Docker build must all pass before merge.
