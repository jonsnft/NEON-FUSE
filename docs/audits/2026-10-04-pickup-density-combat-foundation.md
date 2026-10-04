# Pickup density and combat attribution — 2026-10-04

## Trigger

Manual two-player LAN testing showed that clearing essentially every soft block on `grid-zero` produced only three collectible items. This was not random variance: the official-map arena path intentionally used `max(enabled item kinds, player count)`, which yields three pickups for a two-player standard match.

## Decision

Pickup placement remains deterministic and server-authoritative, but now scales with the amount of destructible map material.

Target pickup count:

- 22% of soft cells, rounded to the nearest whole pickup
- at least two pickups per enabled pickup kind
- at least two pickups per player
- never more pickups than available soft cells
- zero when the selected rules disable all items

Positions are spread deterministically across the ordered soft-cell list and item kinds are cycled evenly.

## Combat-mode foundation

Per-player match metrics now also record:

- opponent eliminations
- self-eliminations
- who directly eliminated the player

Blast cells may carry the owner and source Core identifier. A chain-triggered Core attributes its blast to that Core's owner. This is direct-source attribution, not assist/root-chain attribution; richer scoring can be layered on later without changing Survival resolution now.

## Explicit non-goals

This pass does not introduce teams, respawns, score victory conditions, ranked progression, or monetized power. Survival still resolves when at most one player remains alive.

## Verification targets

- standard rules create materially more than three pickups on a normal soft-block-heavy map
- all enabled item kinds remain represented
- `no-speed` never creates speed pickups
- `no-items` creates no pickups
- direct opponent eliminations increment the Core owner's metric
- self-eliminations are tracked separately
- blast source ownership is present for presentation/future scoring
