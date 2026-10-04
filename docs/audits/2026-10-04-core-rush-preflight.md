# Core Rush / mode architecture preflight — 2026-10-04

## Scope

Introduce the first additional match mode while preserving the existing server-authoritative deterministic kernel, and improve combat readability without moving gameplay truth into the renderer.

## Invariants to preserve

- Shared simulation remains independent of Phaser, Colyseus, platform adapters and monetization.
- Client sends intents only; server remains authoritative.
- Survival remains last-signal-standing with no respawn.
- Core placement, blast geometry, hard/soft-block interaction, pickups and chain reactions remain shared mechanics.
- Creator lobby configuration remains allowlisted and creator-authorized.
- Reduced Motion retains critical warnings.
- No external art/content is imported.

## Planned behavior

### Survival

- 240 seconds.
- Existing pressure-block Sudden Death remains available.
- <=1 alive player resolves the round.
- No respawn.

### Core Rush

- 180 seconds.
- First unique player to 5 direct opponent eliminations wins.
- Self-elimination gives no score.
- 1.5-second reboot after elimination.
- 1-second damage shield after reboot.
- No pressure-block Sudden Death.
- Unique high score wins at deadline; tie is a draw.

## Presentation

A separate client-only combat-readability layer may render:

- connected blast lanes and terminal endcaps,
- upcoming Survival pressure cells,
- reboot phase shields.

It must only read `GameState`.

## Tests required

- Survival final-survivor behavior unchanged.
- Core Rush schedules and executes respawn.
- Spawn shield prevents immediate blast damage.
- Core Rush reaches score target deterministically.
- Self elimination does not increase score.
- Core Rush disables Sudden Death.
- Lobby configuration validates and propagates `gameModeId` through the authoritative server runtime.
- Full architecture/typecheck/test/build/compose/Docker CI gate.

## Known tuning risks

- Upgrade persistence after reboot can snowball.
- Spawn protection duration and offensive freedom need manual playtesting.
- Five points / 180 seconds are initial tuning values.
- Overlapping blast attribution may need a richer event model for future assists/kill feed.
