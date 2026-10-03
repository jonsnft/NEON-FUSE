# ADR 0011: Visual quality tiers and reduced motion

Date: 2026-10-03
Status: Accepted

## Context
NEON FUSE now has a client-only presentation layer and bounded event-derived FX. Stronger cyberpunk atmosphere must not become mandatory for gameplay correctness or exclude lower-performance devices and motion-sensitive users.

## Decision
Introduce a persistent client-only `VisualQuality` contract with `low`, `medium`, and `high` tiers. The tier controls CSS/canvas bloom-like glow, chromatic treatment, CRT strength, transient-FX budgets, trail sampling and camera shake.

Honor `prefers-reduced-motion` independently from quality. Reduced motion disables trails and camera shake and freezes non-essential ambient scan/pulse motion while preserving authoritative gameplay silhouettes and player interpolation.

The visual preference is stored only in browser local storage and never enters shared simulation, protocol, server state, matchmaking or gameplay rules.

## Consequences
- visual fidelity is scalable without forking gameplay;
- accessibility and low-power fallback are first-class;
- future native WebGL post-processing can reuse this quality contract;
- screenshots may differ by quality tier, while gameplay information remains equivalent.
