# Cyberpunk presentation preflight audit

Date: 2026-10-03
Branch: `feature/cyberpunk-presentation-layer`

## Scope
Establish the first production-oriented visual architecture for NEON FUSE without changing gameplay rules, networking authority or deterministic simulation.

## Current state
- `renderWorld()` redraws directly from `GameState`.
- Online rendering occurs when snapshots are accepted, so visual cadence follows network state cadence.
- Arena objects are mostly flat geometric primitives with minimal hierarchy.
- No dedicated visual token system or presentation interpolation exists.

## Allowed changes
- `apps/client/**` rendering/presentation code;
- documentation under `docs/research`, `docs/adr`, `docs/audits`;
- client-only visual constants and interpolation state;
- scene wiring required to run the renderer every frame.

## Forbidden changes for this phase
- shared simulation behavior;
- server tick rate;
- protocol messages;
- movement/core/blast/pickup rules;
- map topology;
- lobby authority;
- economy/platform integration.

## Required verification
1. architecture guard remains green;
2. typecheck remains green;
3. shared/server tests remain green;
4. client production build succeeds;
5. Compose and release container builds remain green;
6. offline and online scenes compile against the same presentation renderer.

## Rollback boundary
The presentation layer is client-only. Reverting this PR restores the previous direct `renderWorld()` path without data migration or server changes.