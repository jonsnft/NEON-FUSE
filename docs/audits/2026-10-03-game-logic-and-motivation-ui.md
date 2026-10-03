# Game logic and motivation UI audit

Date: 2026-10-03

## Scope

Static review of current shared simulation surfaces relevant to the next UI/game-design pass. This audit does not change authoritative gameplay behavior.

Reviewed:
- `packages/shared/src/sim/types.ts`
- `packages/shared/src/sim/actions.ts`
- `packages/shared/src/sim/tick.ts`
- `packages/shared/src/rules/catalog.ts`
- online match HUD integration

## Current logic confirmed

- Dead players cannot move or place Cores.
- Movement blocks hard/soft tiles, occupied Core cells, and living-player cells.
- Revealed pickups are collected on movement and immediately mutate the authoritative player state.
- RANGE increments blast range by one.
- CAPACITY increments simultaneous Core capacity by one.
- SPEED increments speed tier by one.
- Core placement enforces per-player active-Core capacity and prevents two Cores on one cell.
- Core fuse duration comes from the selected pace preset.
- Explosions are cardinal and stop at hard blocks.
- Soft blocks are destroyed, may reveal their hidden pickup, and stop that blast direction.
- Explosions eliminate any living player in the blast cell, including the Core owner.
- Chain detonations are deterministic and counted in match metrics.
- A survival round resolves when one or zero players remain alive.
- Sudden-death reach state is tracked and remains disabled under the no-sudden-death modifier.

## Existing telemetry now useful for UI

`PlayerMatchMetrics` already contains:
- Cores placed;
- pickup counts by type;
- elimination timestamp.

`MatchMetrics` already contains:
- chain-detonation count;
- whether sudden death was reached.

The new HUD uses these existing authoritative metrics. No parallel client-side scoring is introduced.

## Gaps before adding new modes

### Elimination attribution

Current state records when a player was eliminated, but not which Core owner caused the eliminating blast. A kill/score mode must add authoritative blast-source attribution before points are introduced.

### Chain attribution

`chainDetonations` is currently match-global. Core Rush or mastery scoring would need owner/player attribution if chains are intended to award personal score.

### Win-condition abstraction

`resolveRound()` is explicitly survival-based. Team, control, collection, or heist modes should not accumulate conditionals in this function. Introduce a mode/win-condition layer before implementing multiple rule families.

### Team state

There is no authoritative team identifier in `SimPlayer` or game rules today. Team modes require explicit server/shared team assignment and team-aware result calculation.

### Multi-round match score

Rematch exists, but a best-of-N team mode needs match-level score outside one `GameState` round.

### Respawn semantics

Current gameplay is elimination-only. Any score/respawn mode needs deterministic safe spawn selection and anti-spawn-trap rules.

## Design observation for future testing

`blastCells()` mutates destroyed soft blocks immediately while resolving an explosion. Later chained explosions in the same simulation tick therefore observe the updated map. This is deterministic, but it should be treated as an explicit gameplay rule and covered by a regression test before competitive scoring modes depend on precise chain geometry.

## Recommendation

Do not add a new mode in the same change as this UI pass. First ship/read the richer match HUD and collect manual feedback. Next shared-simulation phase should introduce:

1. elimination/blast attribution;
2. mode identifier and win-condition interface;
3. team identity;
4. tests for same-tick chained blast geometry.

These foundations allow mode variety without coupling presentation, monetization, or creator content to authoritative combat rules.
