# Animated character art preflight — 2026-10-03

## Scope boundary
Client rendering only.

No changes are permitted to:
- deterministic simulation behavior,
- movement or placement rules,
- Colyseus protocol semantics,
- server authority,
- monetization or platform adapters.

## Risks checked before implementation
- Do not introduce authoritative facing state for a cosmetic concern.
- Do not make fuse readability depend only on motion.
- Do not make pickup identity depend only on animation or color.
- Do not bypass `prefers-reduced-motion` behavior.
- Keep low-quality mode visually complete enough for gameplay.
- Avoid per-frame object creation and retain the bounded Graphics pass.

## Verification plan
- Unit-test facing inference, deterministic animation seeds, and fuse urgency mapping.
- Run architecture guard, typecheck, tests, production build, compose validation, and both Docker image builds through CI.
- Manually verify four-direction silhouettes, idle/move transitions, fuse acceleration, pickup readability, quality cycling, and reduced-motion behavior.
