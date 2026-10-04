# ADR 0016 — Objective modes stay in shared simulation

## Status

Accepted

## Context

NEON FUSE now supports Survival and Core Rush through a mode-policy layer while preserving one deterministic Core/Blast/Tile/Pickup simulation kernel. Adding spatial objectives creates a risk that mode-specific behavior leaks into the Colyseus room, client presentation or map implementation.

## Decision

Objective-mode rules remain inside `packages/shared` and are represented explicitly in `GameState`.

- `GameModePolicy` selects score source, round duration, respawn behavior and optional objective parameters.
- `SimControlNode` is shared deterministic state.
- objective placement is derived deterministically from validated map geometry;
- objective capture/scoring is advanced by `tickSimulation` through a dedicated objective subsystem;
- `scoreForPlayer()` is the common score boundary for score-based modes;
- `MatchRoom` continues to orchestrate lifecycle, intents and snapshots only;
- clients only render objective state and send the same movement/Core intents used by every mode.

GRID CONTROL is the first spatial-objective implementation under this rule.

## Consequences

### Positive

- Future objective modes can reuse simulation primitives without duplicating networking code.
- Replay/testing determinism remains possible.
- Client presentation can change without changing the authoritative rules.
- Creator maps do not execute mode code; objectives are derived from validated geometry.

### Costs

- `GameState` becomes richer as genuinely shared gameplay concepts are added.
- Every new score source must be explicit in policy and tested against deadline/win resolution.
- Mode additions require regression coverage proving Survival and existing modes remain unchanged.

## Guardrail

Do not add mode-specific timers, scoring, capture rules or win conditions directly to `MatchRoom`, Phaser scenes or rendering code. If a rule affects who wins or how authoritative state changes, it belongs in shared simulation or shared mode policy.
