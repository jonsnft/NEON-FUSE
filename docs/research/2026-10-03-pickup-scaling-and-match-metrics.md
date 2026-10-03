# Pickup scaling and match metrics research

Date: 2026-10-03
Status: Applied

## Question
How should NEON FUSE scale pickup availability from 2 to 8 players without introducing hidden randomness or arbitrary creator sliders, and which match metrics should be recorded before further balance changes?

## Sources reviewed

1. claudin-io/gallery-bomber-man — https://github.com/claudin-io/gallery-bomber-man
   - Uses hidden power-ups under destructible blocks.
   - Documents a 30% drop chance per destroyed soft wall and ~50% soft-wall density.
   - Useful as an implementation reference, not a balance authority.

2. timonmartens/Bomberman — https://github.com/timonmartens/Bomberman
   - Uses blast-range, concurrent-bomb and speed power-ups as progression resources.
   - Starts blast range at 1 and allows growth through pickups.

3. Li et al. (2017), A Visual Analytics Approach for Understanding Reasons behind Snowballing and Comeback in MOBA Games. DOI: 10.1109/TVCG.2016.2598415
   - Demonstrates the value of event-level match data when diagnosing snowballing and comeback behavior.
   - NEON FUSE interpretation: resource collection, eliminations and action frequency should be observable before tuning resource abundance aggressively.

4. Rupp (2025), Game Balancing via Procedural Content Generation and Simulations. DOI: 10.1609/aiide.v21i1.36856
   - Treats level and economy balance as measurable systems that benefit from simulations rather than purely manual intuition.

5. Rupp et al. (2024), It might be balanced, but is it actually good? An Empirical Evaluation of Game Level Balancing. arXiv:2407.11396
   - Automated balance measures remain incomplete without human playtesting.
   - NEON FUSE interpretation: deterministic metrics are decision support, not a substitute for owner/player testing.

## Current NEON FUSE baseline

Before this change, `createArenaFromMap()` creates at most one pickup per allowed pickup kind. Therefore:
- `standard` creates 3 pickups regardless of whether 2 or 8 players join;
- `no-speed` creates 2 pickups regardless of player count;
- `no-items` creates none.

This means standard pickup-per-player availability falls from 1.5 at 2 players to 0.375 at 8 players. The reduction is caused by player count rather than an explicit design choice.

## Decision: deterministic player-count scaling

For any preset with pickups enabled:

`targetPickupCount = min(softCells, max(allowedPickupKinds, playerCount))`

Consequences:
- standard, 2 players: 3 pickups (unchanged);
- standard, 4 players: 4 pickups;
- standard, 8 players: 8 pickups;
- no-speed, 2 players: 2 pickups (unchanged);
- no-speed, 4 players: 4 pickups;
- no-speed, 8 players: 8 pickups;
- no-items: 0 pickups.

Pickup positions remain deterministic and are spread over the ordered soft-cell list. Pickup kinds rotate deterministically through the allowed kind list. No runtime RNG or client-provided quantity is introduced.

This establishes roughly one pickup opportunity per player at larger room sizes while preserving the already-tested 2-player baseline. It is a project hypothesis, not a universal optimum.

## Metrics required before further tuning

The authoritative simulation records:
- Core placements per player;
- pickups collected per player and kind;
- chain detonations;
- elimination time per player when caused by blast simulation;
- whether Sudden Death was reached;
- spawn index for every player.

At round completion the server telemetry boundary receives an aggregate summary including:
- match duration;
- total Core placements;
- total pickups collected;
- chain detonation count;
- elimination times;
- Sudden Death reached/not reached;
- per-spawn elimination observations.

These measurements support the requested future questions:
- pickup-per-player ratio;
- Core-placement frequency;
- chain-reaction rate;
- elimination-time distribution;
- Sudden-Death rate;
- possible spawn-position effects.

## Deliberately deferred

This change does not alter:
- pickup effects;
- starting blast range or Core capacity;
- movement speed;
- soft-block density;
- spawn geometry;
- round duration;
- Sudden Death timing;
- random drop probability (none is introduced).

## Uncertainty

The reviewed sources do not establish an optimal pickup-per-player ratio for NEON FUSE. The one-per-player scaling floor for larger rooms is deliberately conservative and reversible. Future changes should use accumulated metrics plus human playtesting.