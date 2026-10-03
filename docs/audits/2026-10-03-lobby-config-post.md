# Lobby configuration post audit

Date: 2026-10-03
PR: #14

## Result
The waiting lobby now has a server-authoritative creator configuration contract.

Creator-controlled dimensions:
- player capacity: 2–8,
- official map,
- item preset,
- modifier preset.

Accepted changes are broadcast as authoritative waiting-room state. Any accepted configuration mutation clears all Ready votes. Start still requires the minimum player count, every currently connected player Ready, and an explicit creator Start action.

## Supported presets
Items:
- `standard`: range + capacity + speed,
- `no-speed`: range + capacity,
- `no-items`: no pickups.

Modifiers:
- `standard`: deterministic sudden death enabled,
- `no-sudden-death`: no arena contraction; the hard round deadline remains.

## Authority checks verified
- non-creator configuration requests do not change room configuration,
- capacity cannot be reduced below current occupancy,
- creator configuration changes invalidate Ready votes,
- non-creator Start remains rejected,
- the resulting GameState carries the chosen map and gameplay rule presets,
- lobby-only fields are excluded from `GameState.rules`.

## Matchmaking change
Map is no longer a Colyseus matchmaking filter because map selection can change while the room is waiting. The lobby browser instead displays current authoritative room metadata.

## Verification
CI run #63 completed successfully with:
- architecture guard,
- TypeScript typecheck,
- shared/unit tests,
- real Colyseus runtime test,
- production build,
- Docker Compose validation,
- server container build,
- client container build.

## Deliberately deferred
The following are not exposed as creator options yet:
- fuse duration,
- explosion duration/shape,
- base movement speed,
- starting core capacity/range,
- pickup probabilities,
- teams,
- handicaps/dynamic difficulty,
- mid-match rule mutation.

Each material gameplay modifier remains research-gated by `docs/engineering/GAME_DESIGN_CHANGE_POLICY.md` and should receive a research/playtest record before entering the supported rule catalog.

## Architecture conclusion
ADR 0006 remains valid. No additional ADR is required by the implementation. The deterministic simulation remains framework/platform/economy independent.
