# Pickup scaling and match metrics preflight audit

Date: 2026-10-03
Status: Pre-implementation

## Scope
- deterministic pickup quantity scaling by actual player count;
- compact authoritative match metrics;
- aggregate match-finished telemetry payload;
- tests covering 2/4/8 player pickup counts and metric updates.

## Architecture checks
- No Phaser/Colyseus/platform imports enter `packages/shared/src/sim/**`.
- Client does not gain authority over pickup count, drop probability or metric values.
- Existing item presets remain the only player-facing pickup-category control.
- Metrics are observational and cannot feed back into live competitive rules.
- No economy/cosmetic/entitlement behavior changes.
- No random number generator is introduced.

## Compatibility
- Standard 2-player pickup count remains 3.
- No-speed 2-player pickup count remains 2.
- No-items remains 0 at every roster size.
- Existing pace, modifier, map and Ready semantics remain unchanged.

## Required verification
- architecture guard;
- typecheck;
- shared simulation tests;
- real server runtime test;
- production build;
- Compose validation;
- server/client release image builds.

No new architectural boundary beyond ADR 0008 is required.