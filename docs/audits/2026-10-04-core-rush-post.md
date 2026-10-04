# Core Rush / mode architecture post-audit — 2026-10-04

## Result

The first mode-policy expansion is implemented without forking the core simulation. Survival remains the default and CORE RUSH is selectable by the lobby creator.

## Implemented architecture

- `GameRules.gameModeId` is required and allowlisted.
- Mode behavior resolves through the typed rules catalog.
- Movement, Core placement, blast geometry, tiles, pickups and chain reactions remain shared kernel mechanics.
- Server room propagates `gameModeId` into authoritative GameState and room metadata.
- Client UI consumes the mode only for controls/status/presentation.
- `CombatReadabilityLayer` is client-only and reads authoritative state.

## CORE RUSH v1

- 180-second score race.
- First unique player to 5 direct opponent eliminations wins.
- Self-eliminations do not score.
- 1.5-second SIGNAL REBOOT.
- 1-second damage-only phase shield after reboot.
- Upgrades persist through reboot.
- Existing placed Cores remain active through owner elimination.
- No pressure-block Sudden Death.
- Unique high score wins at deadline; tie is a draw.

## Combat readability

- Active blasts receive connected lane geometry and terminal endcaps.
- Survival begins showing upcoming contraction cells eight seconds before pressure begins and continues to show near-future cells during contraction.
- Reboot shielding is represented with a visible ring.
- Reduced Motion freezes/reduces pulse motion but preserves critical warnings.

## Verification

Implementation CI run #118 passed all gates:

- dependency install
- architecture guard
- shared/client/server TypeScript checks
- shared/client/server tests
- production build
- Docker Compose validation
- server Docker image
- client Docker image

Mode-specific regression coverage verifies:

- unchanged Survival round resolution,
- Core Rush reboot timing,
- reboot phase shielding,
- score-target victory,
- self-elimination scoring exclusion,
- Core Rush Sudden Death exclusion,
- creator authorization and mode propagation through the live Colyseus room path.

## Observations / follow-up

These are tuning questions, not merge blockers:

1. **Persistent upgrades:** preserving upgrades across reboot increases continuity but may create a strong snowball. Test 1v1 and 4-player matches before changing it.
2. **Phase shield:** one second currently blocks blast damage while still allowing movement/Core placement. Check whether this enables spawn-offense abuse.
3. **Spawn cell occupancy:** respawn currently returns to the original spawn. Larger modes may eventually need safe-spawn selection if repeated spawn pressure becomes common.
4. **Overlap attribution:** overlapping blast presentation stores a first source per cell while damage credit follows deterministic core-processing order. Assist/kill-feed work should use an explicit combat-event model rather than infer richer attribution from rendered blast cells.
5. **Mode-specific modifiers:** the lobby still exposes the generic modifier selector in CORE RUSH even though pressure Sudden Death is disabled by policy. UI can later label the modifier N/A or filter incompatible options.
6. **Tuning constants:** 5 points, 180 seconds, 1.5-second reboot and one-second shield are initial playtest values.

## Architecture assessment

The change preserves the intended direction: one deterministic simulation kernel, explicit typed policies for match dynamics, and replaceable presentation layers. Future modes should extend this boundary instead of adding mode conditionals to movement, rendering assets or transport code.
