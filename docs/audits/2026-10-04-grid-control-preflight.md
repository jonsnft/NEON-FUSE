# Grid Control preflight audit — 2026-10-04

## Scope

- add `grid-control` as the third game-mode policy;
- represent spatial objectives as deterministic shared simulation state;
- keep Core/Blast/Tile/Pickup mechanics unchanged;
- render Data Nodes and capture progress in the existing combat readability layer;
- expose mode through the existing creator `O MODE` lobby control;
- preserve Survival and Core Rush behavior.

## Architecture checks

- No Phaser/Colyseus/platform imports in shared simulation.
- No objective authority in the client.
- No Grid Control scoring logic in `MatchRoom`.
- Creator maps remain declarative; Data Nodes are derived from validated floor geometry.
- Existing client intents remain sufficient; no new network action is required.

## Gameplay checks

- Node placement must be deterministic, unique and walkable.
- Capture requires one uncontested player for the policy capture duration.
- Contested nodes must not advance capture or score.
- Ownership can be overwritten by another player.
- Score only accrues while the owner is physically linked and uncontested.
- Respawn/invulnerability uses the existing mode policy path.
- Score target and deadline resolution use the shared score abstraction.

## Presentation checks

- Data Nodes must remain visible without obscuring blast geometry.
- Capture progress must be readable without relying only on motion.
- Reduced-motion preferences must not remove objective state information.
- HUD must explain SYNC, node capture and reboot behavior.

## Risks

- richer `GameState` can expose missing literal fixtures in tests;
- objective scoring must not accidentally reuse elimination score;
- node placement on unusual creator maps may find fewer nodes if too few floor cells exist; validation/tests should keep this fail-soft and deterministic.
