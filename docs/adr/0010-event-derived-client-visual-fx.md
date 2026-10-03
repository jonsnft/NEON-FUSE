# ADR 0010: Event-derived client visual FX

Date: 2026-10-03
Status: Accepted

## Context
NEON FUSE now has a client-only presentation layer that interpolates authoritative GameState into a smoother visual representation. The next visual phase needs transient feedback for movement, Core placement, explosions, block destruction, pickup collection and camera impact.

Adding renderer-specific events to the deterministic simulation would couple gameplay code to presentation concerns. Conversely, purely decorative continuous effects would not communicate gameplay events precisely enough.

## Decision
Phase 2 visual feedback is derived on the client by comparing consecutive authoritative GameState snapshots and presentation positions.

The renderer owns bounded transient FX records with timestamps. These records may influence only drawing and camera presentation.

Allowed derived cues:
- newly observed Cores -> placement pulse;
- newly observed blast cells -> explosion burst;
- soft-to-floor tile transitions -> destruction fragments;
- disappearing revealed pickups -> collection effect;
- player presentation displacement -> trail;
- newly observed blast activity -> small camera shake subject to cooldown.

## Authority boundary
Transient FX state:
- is never serialized;
- is never sent to the server;
- is never read by movement, collision, Core placement or hit resolution;
- may be dropped entirely without changing gameplay outcome.

## Performance boundary
Effects have finite lifetime and a hard record cap. Phase 2 uses the existing Phaser Graphics path and camera API rather than mandatory particle emitters or custom shaders.

## Consequences
Positive:
- substantially richer game feel without altering simulation semantics;
- clean rollback path because effects are presentation-only;
- compatible with lower-end browser hardware.

Trade-offs:
- snapshot-delta inference cannot always identify the semantic cause of every state change;
- effects are visual approximations of authoritative events;
- future advanced art may justify an explicit presentation-event stream, which would require a separate ADR.
