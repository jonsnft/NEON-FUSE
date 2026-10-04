# Bomber-mode architecture research — 2026-10-04

## Purpose

Study established grid-bomb battle structures without copying protected content, then extract reusable mechanical patterns for NEON FUSE.

## Reference patterns

Official Super Bomberman R / R2 material shows a useful structural pattern: one stable bomb/grid interaction model supports several distinct match goals. Standard play centers on survival. Grand Prix variants score through opponent defeats or collection. Castle introduces an asymmetric attacker/defender objective. Sudden Death applies outside-in spatial pressure rather than replacing the core controls.

These references are used only as abstract game-design research. NEON FUSE does not reuse names, maps, characters, art, audio, text, or proprietary implementation details.

## Architecture conclusion

NEON FUSE should treat these layers separately:

1. **Simulation kernel** — movement, Energy Core placement, cardinal blast propagation, hard/soft tiles, pickups, chain reactions and authoritative damage.
2. **Mode policy** — duration, respawn policy, score target, pressure policy and win condition.
3. **Presentation** — HUD language, warnings, blast readability, score display, reboot feedback and cosmetic treatment.
4. **Networking/platform** — transport, identity, telemetry and external platform integration remain outside the simulation kernel.

A new mode should reuse the kernel and change policy. It should not fork movement, blast geometry or pickup code unless the mechanic itself genuinely changes.

## First derived NEON FUSE mode: CORE RUSH

CORE RUSH is an original score-oriented signal-combat mode:

- 180-second round.
- First player to five clean opponent eliminations wins immediately.
- Eliminated players enter SIGNAL REBOOT for 1.5 seconds rather than leaving the round.
- Reboot grants a one-second phase shield to avoid deterministic spawn deletion.
- Self-eliminations do not grant score.
- Existing Energy Cores remain active after their owner is eliminated, preserving delayed-risk and chain-reaction play.
- Power upgrades currently survive reboot. This intentionally rewards map control, but must be playtested for snowballing.
- Pressure-block Sudden Death is disabled because the score race itself supplies forward pressure.
- If time expires, the unique highest score wins; a tie is a draw.

## Why this fits NEON FUSE

The mode shifts the emotional rhythm without changing the player's learned verbs. Survival rewards preservation and route denial. CORE RUSH rewards initiative, repeated engagements and fast adaptation after failure. The cyberpunk fiction translates elimination into a temporary signal loss and respawn into a network reboot, making the respawn loop native to the world rather than an imported deathmatch convention.

## Combat readability principles

The first presentation pass should make existing state easier to reason about rather than add decorative noise:

- Blast cells communicate connectivity, direction and terminal endcaps.
- Upcoming Survival pressure cells are telegraphed before they harden.
- Reboot invulnerability has a visible phase-shield ring.
- Critical warnings remain visible with Reduced Motion enabled.
- The overlay reads authoritative state only and never feeds information back into simulation.

## Future modes

The policy layer should be sufficient to support staged additions without parallel simulations:

- **Circuit Teams** — team ownership and team win policy over the same kernel.
- **Grid Control** — score from controlled nodes / time-on-objective.
- **Data Heist** — asymmetric objective policy with side switching.
- **Data Harvest** — collection pressure if playtests show that it reinforces rather than dilutes combat.

Before those modes, add only the domain data they genuinely require (for example team identity, objective state or assist attribution). Do not pre-build a generic rules engine.

## Risks to playtest

- Persistent upgrades through reboot may create runaway leaders.
- One-second spawn shield may be too short or may allow overly safe offensive placement.
- Overlapping blast cells currently retain the first stored visual source, while damage attribution follows deterministic simulation order. Future assist/kill-feed work may need richer event attribution.
- Five eliminations and 180 seconds are initial tuning values, not permanent constants.

## Sources consulted

- Konami official Super Bomberman R 2 battle-mode documentation.
- Konami official Super Bomberman R Online manual, including Standard and Sudden Death behavior.
