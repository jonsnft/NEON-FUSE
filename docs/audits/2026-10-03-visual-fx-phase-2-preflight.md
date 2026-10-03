# Visual FX Phase 2 preflight audit

Date: 2026-10-03
Branch: `feature/visual-fx-phase-2`

## Scope
Client presentation only:
- movement trails;
- Core placement impulse;
- explosion sparks;
- soft-block destruction fragments;
- pickup collection feedback;
- restrained camera impact.

## Explicit non-scope
- no gameplay-rule changes;
- no shared simulation changes;
- no protocol changes;
- no server changes;
- no economy/cosmetics authority changes;
- no mandatory shader/PostFX pipeline;
- no final sprite/tile asset import.

## Safety / architecture checks
- FX are derived from authoritative snapshot deltas or presentation motion.
- FX coordinates must never be fed back into gameplay intents.
- All transient records must expire and be capped.
- Camera shake must be cooldown-limited and low amplitude.
- Critical gameplay silhouettes remain drawn after transient background fragments where needed.

## Verification plan
Run architecture guard, typecheck, tests, production build, Compose validation, and both Docker image builds. Record post-audit before merge.
