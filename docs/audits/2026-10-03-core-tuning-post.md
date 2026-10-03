# Core tuning post-audit

Date: 2026-10-03
PR: #15
Status: Implementation verified before final documentation-only CI

## Implemented

### Creator pace rule
- Added `pacePresetId` to the shared `GameRules` / `LobbyConfig` contract.
- Allowlist:
  - `standard` -> 1800 ms Core fuse (existing behavior preserved).
  - `tactical` -> 2400 ms Core fuse.
- Client sends preset IDs only; raw fuse milliseconds remain rejected by lobby validation.
- Creator cycles pace with `F` while waiting.
- Pace is visible in waiting-room UI, room browser, active HUD and finished-match status.
- Accepted pace changes clear Ready votes through the existing authoritative lobby configuration flow.
- `GameState.rules` stores the selected pace preset.
- `placeCore()` derives its default fuse from authoritative `GameState.rules`.

### Arena balance baselines
Added deterministic `analyzeArenaBalance()` metrics and regression tests for official maps:
- hard / soft / floor tile counts;
- soft ratio of floor+soft potential traversable space;
- immediate floor egress per spawn;
- minimum pairwise Manhattan spawn distance.

Current baselines:
- Grid Zero: hard 80, soft 50, floor 65, soft ratio ~43.48%.
- Data Cross: hard 88, soft 45, floor 62, soft ratio ~42.06%.
- Switchyard: hard 71, soft 56, floor 68, soft ratio ~45.16%.
- All official maps: spawn egress `[2,2,2,2,3,3,3,3]`; minimum pairwise spawn distance >= 5.

These numbers are regression/reference baselines, not universal balance targets.

## Verified behavior
GitHub Actions CI run #72 completed successfully on the implementation/documentation head before this post-audit was added:
- architecture guard: success;
- typecheck: success;
- all tests: success;
- production build: success;
- `docker compose config`: success;
- server release image build: success;
- client release image build: success.

Shared tests prove exact 1800 ms vs 2400 ms fuse resolution. The real Colyseus runtime test proves Creator-only rule mutation, Ready reset and pace propagation into the started game.

## Deliberately unchanged
- movement cadence / speed-tier model;
- initial blast range = 1;
- initial Core capacity = 1;
- official map geometry;
- pickup category/distribution logic;
- 240-second hard match deadline;
- 180-second standard Sudden Death start;
- cosmetics, economy, entitlements and platform adapters.

## Research status
Research basis is recorded in `docs/research/2026-10-03-core-pacing-and-arena-balance.md` and architecture decision in `docs/adr/0007-explicit-static-pace-presets.md`.

The exact 2400 ms tactical value is explicitly a project hypothesis. External references establish useful ranges/patterns but do not establish an optimum for NEON FUSE.

## Next research block
Use the new baselines plus real playtest/telemetry data to evaluate pickup density and player-count scaling. Required observations include pickup-per-player ratio, Core placement frequency, chain-reaction rate, elimination timing, percentage of matches reaching Sudden Death and spawn-position outcome distribution.