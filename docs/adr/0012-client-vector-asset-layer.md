# ADR 0012: Client vector asset layer

Date: 2026-10-03
Status: Accepted

## Context
NEON FUSE now has a client-side presentation layer, transient FX and visual quality tiers, but core world objects are still represented by prototype geometric primitives. We need a production-art vocabulary without coupling art assets to authoritative simulation.

## Decision
Introduce a separate `CyberpunkAssetLayer` in the client renderer. It draws original, version-controlled vector sprite/tile assets from authoritative `GameState` plus presentation/cosmetic metadata.

The asset layer:
- is client-only;
- never changes or emits simulation state;
- receives `GameState` as read-only presentation input;
- uses the existing 48 px grid and map IDs;
- assigns each official map a stable material theme;
- draws opaque base materials/entities while the existing `NeonWorldRenderer` retains transient FX, glow and motion interpolation;
- uses cosmetic information only for visual tint/token selection.

## Consequences
- Art direction can evolve independently from simulation and networking.
- Map identities become visible without changing map collision geometry.
- Original source art remains auditable and license-safe in the repository.
- A later PNG/atlas pipeline can replace vector drawing behind the same layer contract.
- Rendering cost increases by one bounded Graphics pass; no physics, shader or network cost is added.

## Rejected alternatives
### Third-party production pack as the primary art source
Rejected for the first production pass because it creates licensing/style-lock risks and weakens control over Creator content consistency.

### Move art/material metadata into shared simulation
Rejected because material identity is presentation data and must not become a gameplay dependency.

### Replace the current FX renderer wholesale
Rejected because Phase 1–3 already provide tested interpolation, FX and quality-tier behavior. The new layer should compose with that stable boundary.
