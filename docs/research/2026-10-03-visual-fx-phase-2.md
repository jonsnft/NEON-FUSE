# Visual FX Phase 2 research

Date: 2026-10-03

## Question
How should NEON FUSE add movement trails, Core placement feedback, blast particles, block destruction, pickup collection and camera impact without compromising gameplay readability, determinism or browser performance?

## Findings

### Game feel should reinforce mechanics, not decorate them
Game-feel literature consistently treats particles, screen shake, deformation and secondary motion as cues that communicate the physical meaning of an interaction. Effects are most useful when tied to important gameplay events rather than emitted continuously without hierarchy.

References reviewed:
- Steve Swink / Game Developer discussion of game feel and polish: particles and small screen shake can materially improve perceived physicality when they reinforce interactions.
- Game Developer discussions of "juice": animation and particles should echo the core mechanic; excessive effects can reduce clarity.

### Readability remains the constraint
NEON FUSE is a grid-based competitive arena. The player must read occupied cells, Core positions, blast cells and pickup locations immediately. Effects therefore must:
- be short lived;
- remain behind or around critical silhouettes;
- use bounded counts;
- never conceal blast occupancy;
- avoid large persistent camera displacement.

### Event-derived presentation is preferable to simulation-side FX events at this stage
The client already receives authoritative snapshots. Phase 2 can derive presentation events from snapshot deltas:
- new Core coordinate -> placement pulse;
- new blast coordinate -> blast spark burst;
- soft tile -> floor transition -> destruction burst;
- revealed pickup disappearing while a living player occupies the tile -> collection burst;
- player presentation movement -> trail segment.

This keeps the shared simulation free from renderer-specific concepts. If future art requires exact semantic causes that cannot be inferred robustly, a presentation-event protocol can be considered separately.

### Camera impact should be sparse
Camera shake is useful for major blast onset but should remain low amplitude and brief. It must not occur for every animation frame or every blast cell. Phase 2 therefore uses a cooldown and a small duration/intensity.

## Decision
Implement a bounded client-only transient FX system inside the presentation layer:
- short movement trail segments;
- Core placement rings/sparks;
- blast spark bursts;
- soft-block destruction fragments;
- pickup collection rings/sparks;
- small, cooldown-limited camera shake on newly observed blast activity.

No shader/PostFX dependency is introduced in this phase. Bloom/CRT remains the next quality layer.

## Performance constraints
- fixed upper bound on transient FX records;
- effects expire by timestamp;
- no physics bodies;
- no network messages;
- no allocation-heavy particle emitter graph;
- one existing Graphics surface remains the primary draw surface.
