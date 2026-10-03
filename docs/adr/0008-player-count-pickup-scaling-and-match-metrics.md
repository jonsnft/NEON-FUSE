# ADR 0008: Player-count pickup scaling and authoritative match metrics

Status: Accepted
Date: 2026-10-03

## Context
NEON FUSE supports 2–8 players, but pickup creation previously depended only on the number of enabled pickup categories. Standard therefore produced the same three pickups for both 2-player and 8-player matches. Further balancing also lacked structured measurements for Core usage, chains, eliminations, Sudden Death and spawn-slot outcomes.

## Decision
1. Pickup quantity scales deterministically with the actual match roster while preserving the existing 2-player baseline.
2. Pickup categories remain controlled by the existing item preset; clients cannot supply counts or probabilities.
3. Pickup positions and kind assignment remain deterministic.
4. The authoritative `GameState` contains match metrics updated by simulation actions/ticks.
5. Match completion emits an aggregate metric summary through the existing server telemetry boundary.
6. Metrics are observational only; they do not alter gameplay during a running round.

## Scaling rule
For pickup-enabled presets:

`min(number of soft cells, max(number of allowed pickup kinds, number of players))`

`no-items` remains zero.

## Metrics
Per-player:
- spawn index;
- Core placements;
- pickups collected by kind;
- blast-elimination time.

Round-level:
- chain detonations;
- whether Sudden Death was reached.

## Consequences
- Larger rooms no longer receive a fixed three/two-pickup pool solely because category count is fixed.
- Existing 2-player standard and no-speed pickup counts remain unchanged.
- Game snapshots become slightly larger because compact metrics are part of `GameState`.
- Future balance changes can be based on reproducible observations rather than intuition alone.
- Platform telemetry implementations may persist aggregates later; local mode remains safe without external credentials.

## Rejected alternatives
- Random percentage drops: rejected for this phase because they reduce deterministic reproducibility and introduce another tuning dimension.
- Arbitrary creator pickup-count sliders: rejected because they bypass researched presets and make Ready semantics harder to reason about.
- Hidden dynamic item adjustment mid-match: rejected because competitive rules should remain visible before Ready/Start.
- Server-only ephemeral metrics: rejected because simulation-level events such as chain reactions and pickup collection are most reliably recorded at their authoritative source.