# Core pacing and arena balance research

Date: 2026-10-03
Status: Applied to Phase 1 of core tuning

## Question
How should NEON FUSE expose creator-controlled tuning for Core fuse timing and match pacing without turning the lobby into an unsafe collection of arbitrary numeric sliders, and what should be measured before changing block density, pickup density or spawn structure?

## Sources reviewed

### Open-source implementation references

1. timonmartens/Bomberman — https://github.com/timonmartens/Bomberman
   - Documents a 3-second bomb fuse.
   - Starts blast reach at 1 tile and allows it to grow through power-ups.
   - Uses a hard match timer and explicit end-of-timer pressure.
   - This is an implementation reference, not balance authority.

2. claudin-io/gallery-bomber-man — https://github.com/claudin-io/gallery-bomber-man
   - Documents an approximately 3-second fuse.
   - Starts blast radius at 1.
   - Scatters soft walls across roughly half of eligible cells.
   - Clears an L-shaped safe pocket around each corner spawn.
   - Uses a documented power-up chance rather than invisible hand tuning.
   - This is an implementation reference, not balance authority.

### Research

3. Baldwin, Johnson, Wyeth, Sweetser (2013), A framework of Dynamic Difficulty Adjustment in competitive multiplayer video games. DOI: 10.1109/IGIC.2013.6659150
   - Competitive multiplayer challenge/balance is a distinct design problem from single-player difficulty.
   - Dynamic balancing exists in many games, but it should be treated as an explicit design mechanism rather than an accidental side effect.

4. Baldwin et al. (2016), Crowd-Pleaser: Player Perspectives of Multiplayer Dynamic Difficulty Adjustment in Video Games. DOI: 10.1145/2967934.2968100
   - Reported player perspectives emphasize control and awareness of multiplayer difficulty adjustment.
   - NEON FUSE interpretation: creator-selected pre-match presets are preferable to hidden mid-match parameter mutation for the competitive default ruleset.

5. Klarkowski et al. (2016), Operationalising and evaluating sub-optimal and optimal play experiences through challenge-skill manipulation.
   - Challenge-skill balance affects enjoyment, autonomy and player experience.
   - NEON FUSE interpretation: pacing variants should be treated as explicit play modes/hypotheses, not as an assertion that one universal timing is optimal.

6. Papagiannakis et al. / IEEE Transactions on Games (2024), Simulation-Driven Balancing of Competitive Game Levels With Reinforcement Learning. DOI: 10.1109/TG.2024.3399536
   - Competitive level balancing benefits from measurable objectives and repeated simulation rather than visual intuition alone.
   - NEON FUSE interpretation: before changing block density or spawn geometry, add deterministic metrics/tests that make those properties inspectable.

## Current NEON FUSE baseline

At the start of this change:
- Core fuse is hard-coded to 1800 ms in `placeCore()`.
- Initial blast range is 1.
- Initial Core capacity is 1.
- Official maps use declarative, deterministic tile layouts.
- Spawn construction clears the spawn cell plus its cardinal neighboring cells.
- Pickup categories are deterministic and allowlisted by the item preset.
- Match duration is 240 seconds and standard Sudden Death begins at 180 seconds.

The existing 1800 ms default has already been play-smoke-tested by the project owner. Therefore this change must not silently replace it.

## Findings

### Fuse timing
The reviewed open-source references cluster around a roughly 3-second fuse, while NEON FUSE currently uses 1.8 seconds. That does not prove 1.8 seconds is wrong: input cadence, movement model, network latency, map scale and target audience materially change the useful timing range.

Decision: preserve 1800 ms as `standard` and introduce a clearly visible `tactical` preset at 2400 ms. 2400 ms is intentionally between the tested NEON FUSE baseline and the approximately 3-second external references. It is a design hypothesis to be validated with telemetry/playtesting, not a literature-derived optimum.

### Blast range and Core capacity
Starting range 1 and capacity 1 are common, readable baselines and already fit NEON FUSE's existing pickup progression. No change in this phase.

### Spawn safety
Current official-map generation clears the spawn cell and cardinal adjacent cells. This supplies immediate movement choices and avoids a player beginning sealed behind a soft block. This phase adds tests/analysis around this invariant rather than changing it.

### Soft-block density
Density strongly affects navigation, line-of-sight, escape routes, pickup exposure and match tempo. The reviewed implementation reference around ~50% is useful context, not a target that should overwrite authored NEON FUSE maps. Density changes are deferred until an arena-analysis helper can report comparable metrics per official map.

### Pickup distribution
A per-wall random drop chance is common in implementations, but NEON FUSE currently prioritizes deterministic simulation and reproducible maps. This phase keeps deterministic pickup placement and category allowlisting. Player-count scaling and density will be evaluated separately after metrics are available.

### Match pressure
The existing 240-second hard limit and 180-second Sudden Death are already bounded and deterministic. Tactical changes Core decision time only; it does not silently change match duration or Sudden Death timing.

## Applied design

Add `pacePresetId` to shared game rules and lobby configuration:
- `standard`: 1800 ms Core fuse; exactly preserves current behavior.
- `tactical`: 2400 ms Core fuse; gives more reaction/planning time without changing movement, blast range, capacity, map topology, pickup categories, round duration or Sudden Death timing.

The preset is:
- selected only while the room is waiting;
- visible to all players in the waiting snapshot/room metadata;
- mutable only by the Creator;
- validated by the server;
- copied into `GameState.rules` for reproducibility;
- treated as a material configuration change, therefore clearing all Ready votes.

## Deferred hypotheses / required next metrics
Before changing these parameters, measure and record per official map:
1. eligible floor/soft/hard tile counts and soft-block ratio;
2. spawn egress count and nearest blocking distance;
3. pairwise spawn distances;
4. pickup count by kind and pickup-per-player ratio;
5. average time-to-first-open-route in deterministic simulation or recorded matches;
6. elimination timing and percentage of rounds reaching Sudden Death.

## Uncertainty
No reviewed source establishes a universal optimal fuse, block density or pickup rate for NEON FUSE's exact input model, server tick, maps or audience. The exact `tactical = 2400 ms` value is therefore an explicit project hypothesis. It must remain easy to revise from Git history after playtest data exists.