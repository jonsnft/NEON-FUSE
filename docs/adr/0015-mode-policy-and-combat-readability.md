# ADR 0015: Mode policy over a stable simulation kernel

- Status: Accepted
- Date: 2026-10-04

## Context

NEON FUSE needs more than one match experience without turning each game mode into a separate simulation. The existing deterministic shared package already provides the important invariant mechanics: grid movement, Energy Core placement, blast propagation, destructible tiles, pickups, chain reactions and authoritative damage.

Mode-specific win conditions, respawn behavior and presentation had started to become the next source of potential coupling. If these concerns are implemented as conditionals scattered across client scenes, server rooms and rendering code, every future mode increases regression risk.

## Decision

The architecture is split into three explicit layers.

### 1. Simulation kernel

The shared simulation continues to own the authoritative mechanical verbs and geometry. Movement, Core placement, blast paths, tiles, pickups and damage remain common across modes.

### 2. Mode policy

`GameRules.gameModeId` is required and resolves through a small typed mode catalog. A mode policy owns only properties such as:

- round duration,
- whether pressure-block Sudden Death is allowed,
- respawn delay,
- respawn shield duration,
- score target,
- mode-specific round resolution.

`gameModeId` is deliberately not optional. Tests and callers must state the intended mode so no new feature silently falls back to Survival.

The first policies are:

- `survival`: existing 240-second last-signal-standing behavior with no respawn.
- `core-rush`: 180-second score race, first to five direct opponent eliminations, 1.5-second reboot and one-second phase shield.

### 3. Presentation

Combat readability is client-only and observes authoritative state. `CombatReadabilityLayer` renders blast connectivity/endcaps, upcoming pressure cells and reboot shields. It does not calculate damage, alter timers or write back into simulation.

## Consequences

### Positive

- New match goals reuse one mechanical kernel.
- Survival regressions remain easy to test independently from new modes.
- Lobby/server/client all carry an explicit mode identifier.
- Renderer changes cannot alter authoritative rules.
- Future teams/objectives can add narrowly scoped domain data rather than fork the game.

### Costs

- Mode-aware resolution remains a deliberate branch in shared simulation; it is not a fully generic scripting system.
- Every fixture constructing `GameRules` must name a mode.
- Respawn modes introduce player lifecycle fields (`spawnX`, `spawnY`, `respawnAtMs`, `invulnerableUntilMs`).

## Guardrails

- Do not move Phaser, Colyseus, platform or monetization dependencies into shared simulation.
- Do not duplicate movement/blast/pickup implementations per mode.
- Do not add a generic user-scripted mode engine for hypothetical requirements.
- New mode state must be deterministic, serializable and server authoritative.
- Presentation may infer visual geometry from state but may never become a source of gameplay truth.
- Reduced Motion may reduce animation, not remove critical combat warnings.

## Deferred decisions

- Team identity and team scoring.
- Assist attribution.
- Objective-node / payload state.
- Whether CORE RUSH drops or preserves upgrades after reboot; v1 preserves them for playtesting.
- Whether spawn shielding should restrict Core placement; v1 shields damage only.
