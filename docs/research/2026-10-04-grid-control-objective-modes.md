# Grid Control / objective-mode research — 2026-10-04

## Goal

Extend NEON FUSE beyond elimination-only modes without fragmenting the simulation architecture.

## Established battle-game pattern

Official Bomberman material demonstrates a durable pattern: keep the same movement, bombs, blast lanes, destructible terrain and power-up grammar, then vary the match dynamic through win conditions, scoring, respawns and spatial objectives.

Relevant official references:

- Super Bomberman R Grand Prix: teams can compete on eliminations, crystals or checkpoints. Checkpoints are occupied by standing in them; held checkpoints continue producing points and can be retaken. Players return after a delay following a mistake.
  - https://www.konami.com/games/bomberman/r/us/en/gp/
  - https://www.konami.com/games/bomberman/r/eu/de/gp/
- Super Bomberman R 2 exposes Standard survival, elimination/team scoring, collection and asymmetric objective modes while retaining the recognizable bomb-grid kernel.
  - https://www.konami.com/games/bomberman/r2/us/en/battle/

These references are used only for abstract game-structure research. NEON FUSE does not copy names, characters, art, stages or proprietary content.

## NEON FUSE interpretation

GRID CONTROL introduces three DATA NODES derived deterministically from walkable map geometry.

Rules:

- 180 second match.
- Respawn after 1.5 seconds with a 1 second phase shield, matching the existing respawn-policy layer.
- Three nodes are selected from deterministic floor cells near strategic anchors.
- A player captures an unowned/enemy node by remaining alone on it for 1 second.
- Ownership persists after leaving, but SYNC points only accrue while the owner is physically linked on the node.
- If more than one player occupies the node, capture/scoring pauses.
- One SYNC point is uploaded per second of uncontested live link.
- First player to 30 SYNC wins; otherwise the unique highest score wins at the deadline.

This differs intentionally from passive territory holding. Requiring a live physical link creates exposure, Core zoning and route-control tension that fits the cyberpunk network theme.

## Architectural conclusions

1. Core/Blast/Tile/Pickup simulation remains unchanged.
2. Mode policy chooses score source, respawn policy, deadline and optional control-objective parameters.
3. Objective state belongs in shared deterministic `GameState`.
4. The Colyseus room remains an orchestration layer and must not implement objective rules.
5. The client only visualizes node ownership/capture progress and sends normal movement/Core intents.
6. `scoreForPlayer()` is the shared abstraction consumed by round resolution, deadline resolution and HUD presentation.

## Follow-on modes

With survival, elimination score and spatial-control score now represented, future modes should reuse these primitives before adding new ones:

- team score aggregation over existing player scores;
- collection objectives represented as shared objective entities;
- asymmetric attack/defense using role/team policy plus objective ownership;
- best-of-round match shells outside the deterministic round kernel.
