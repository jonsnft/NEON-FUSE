# Pickup scaling and match metrics post audit

Date: 2026-10-03
Status: Implementation complete

## Implemented
- Pickup-enabled matches now scale deterministic pickup quantity with actual player count.
- Standard remains 3 pickups at 2 players and scales to 4 at 4 players and 8 at 8 players.
- No-speed remains 2 pickups at 2 players and scales to 4 at 4 players and 8 at 8 players.
- No-items remains zero.
- Pickup positions are deterministically spread across ordered soft cells.
- Pickup kinds rotate deterministically through the allowlisted preset kinds.
- `GameState.metrics` records per-player spawn index, Core placements, pickup collections and blast-elimination timing.
- Round metrics record chain detonations and whether Sudden Death was reached.
- `match.finished` platform telemetry now includes a compact aggregate balance summary.

## Authority audit
- Clients cannot choose pickup count, placement or random probability.
- All metric mutations occur in authoritative shared simulation actions/ticks.
- Metrics do not feed back into live rules or difficulty.
- Existing Creator item presets remain the only pickup-category configuration surface.

## Deliberately unchanged
- pickup effects;
- soft-block density and map geometry;
- spawn geometry;
- movement cadence;
- starting blast range and Core capacity;
- Core pace presets;
- round duration and Sudden Death schedule;
- cosmetics, economy, identity and entitlement boundaries.

## Verification
CI run #75 passed:
- architecture guard;
- typecheck;
- unit/shared tests including 2/4/8-player pickup scaling and metric mutation tests;
- real Colyseus runtime tests;
- production build;
- Docker Compose validation;
- server release image build;
- client release image build.

## Follow-up
The next balance decision should use these metrics rather than immediately changing more values. Priority observations are:
1. pickup collection rate by player count and kind;
2. Core placements per player-minute;
3. chain detonations per placed Core;
4. median/percentile elimination times;
5. proportion of standard matches reaching Sudden Death;
6. elimination outcomes grouped by spawn index.

No further tuning threshold is declared optimal until playtest data exists.