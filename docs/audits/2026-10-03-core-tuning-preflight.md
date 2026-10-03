# Core tuning preflight audit

Date: 2026-10-03
Branch: `feature/core-tuning-presets`

## Scope
Introduce one additional bounded Creator rule: an explicit match pace preset controlling authoritative Core fuse duration.

## Architecture checks before implementation
- Server remains authoritative for lobby mutation and gameplay outcomes.
- Clients may select only allowlisted preset IDs; no client-supplied raw millisecond values.
- Existing `standard` behavior must remain exactly 1800 ms.
- `GameState.rules` must carry the selected pace preset for replay/debug reproducibility.
- A material pace change must clear Ready votes through the existing lobby-config path.
- Shared simulation remains independent from Phaser, Colyseus, platform adapters, entitlements and cosmetics.
- Official map topology, pickups, economy and platform integration are outside this change.

## Research gate
Research note: `docs/research/2026-10-03-core-pacing-and-arena-balance.md`
ADR: `docs/adr/0007-explicit-static-pace-presets.md`

## Verification plan
1. Shared protocol validation accepts only `standard` and `tactical` pace IDs.
2. Shared rules tests prove 1800 ms vs 2400 ms Core fuse behavior.
3. Real Colyseus runtime test proves non-Creator rejection, Ready reset and selected pace propagation into `GameState.rules`.
4. Architecture guard, typecheck, all tests, production build, Compose and both release images must pass before merge.