# Player motivation, mode variety, and match UI research

Date: 2026-10-03

## Goal

Increase replay value and moment-to-moment clarity without using manipulative retention patterns. The target is voluntary replay driven by mastery, autonomy, social rivalry, readable goals, and meaningful variation.

## Research basis

### Self-Determination Theory

Self-Determination Theory identifies autonomy, competence, and relatedness as basic psychological needs that support higher-quality intrinsic motivation and persistence. For NEON FUSE this maps well to:

- autonomy: map/rules/mode choice and multiple viable tactical routes;
- competence: readable cause/effect, visible improvement, useful post-round feedback;
- relatedness: rematches, team play, rivalry, creator rooms, and shared map experiences.

Source: https://selfdeterminationtheory.org/the-theory/

### MDA framework

The MDA framework separates mechanics, the dynamics those mechanics produce, and the player-facing aesthetics/experience. New modes should therefore not start as a list of arbitrary rules. Each mode should target a distinct dynamic and emotional texture while reusing the same movement/Core/blast fundamentals.

Source: https://www.cs.northwestern.edu/~hunicke/MDA.pdf

### Challenge, skill, and flow

Research supports clear goals, control, and an appropriate relationship between challenge and skill as contributors to flow, but the evidence does not justify a simplistic hidden difficulty algorithm. One preregistered game study found objective difficulty-skill ratios did not significantly change enjoyment or engagement. NEON FUSE should therefore favor transparent rule presets, matchmaking/room choice, and readable mastery rather than covert dynamic difficulty.

Sources:
- https://www.tandfonline.com/doi/abs/10.1080/17439760.2014.967799
- https://pubmed.ncbi.nlm.nih.gov/36756072/
- https://www.sciencedirect.com/science/article/pii/S074756321530056X

Flow can also increase the urge to continue playing and has been discussed in the context of problematic play. This is a reason to avoid deliberately engineering compulsive loops, opaque streak pressure, or monetized variable rewards.

Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC8943660/

## Competitive references

Super Bomberman R 2 demonstrates that the same core interaction can support survival, team scoring, collection objectives, large-field survival, and asymmetric attack/defense. Its official modes include Standard, Grand Prix, Battle 64, and Castle.

Source: https://www.konami.com/games/bomberman/r2/eu/de/battle/

Rocket League's extra modes are another useful pattern: retain the same familiar movement foundation while introducing one strong rules twist or power-up layer rather than rebuilding the whole game.

Source: https://www.epicgames.com/help/c-37599050/c-32343914/a24486133?lang=de

## Recommended NEON FUSE motivation loop

1. **Immediate clarity** — the HUD always states the current objective, controls, item meaning, and danger state.
2. **Short mastery feedback** — post-round recap shows player-controlled actions such as Cores placed and Pickups collected rather than only win/loss.
3. **Rapid rematch** — retain rivalry and learned map knowledge with one-key rematch voting.
4. **Rule autonomy** — creator-controlled map, item preset, modifier, pace, and later mode selection.
5. **Social depth** — team modes and creator maps provide reasons to return that are not dependent on artificial daily pressure.
6. **Cosmetic expression** — visual identity without gameplay advantage.
7. **Discoverable depth** — simple controls, but chain timing, route denial, item priority, and contraction create expertise.

## Mode roadmap

### 1. Survival

Current mode. Last player alive wins. This remains the canonical competitive baseline and the reference used to balance all shared mechanics.

### 2. Circuit Teams

2v2, 3v3, or 4v4. A round awards a team point when the opposing team is eliminated. Best-of-N short rounds. Intended dynamic: cooperation, rescue pressure, shared lane control, rivalry.

Required simulation work:
- team identity in authoritative state;
- team-aware win resolution;
- multi-round score state.

### 3. Core Rush

Timed score mode. Players score for opponent eliminations and intentional chain detonations, with respawns after a short deterministic delay. Intended dynamic: aggression and creative chaining rather than hiding for survival.

Required simulation work:
- blast/elimination attribution;
- per-player score;
- deterministic respawn selection;
- anti-spawn-trap rules.

### 4. Data Harvest

Revealed data nodes/pickups contribute objective points while combat remains lethal or temporarily disabling depending on test results. Intended dynamic: route choice and conflict around resources.

Required simulation work:
- objective pickup type separate from powerups;
- score state;
- score target or timer win condition.

### 5. Grid Control

Teams contest a small number of fixed terminals. A terminal accumulates control only while a team has uncontested presence in its local region. Cores become area-denial tools. Intended dynamic: territorial pressure and rotations.

Required simulation work:
- control nodes;
- occupancy/control calculation;
- team scoring.

### 6. Data Heist

Asymmetric attack/defense. Attackers retrieve a key/data packet and reach an extraction node; defenders delay them until the timer expires. Swap sides between rounds. Intended dynamic: asymmetric planning and role identity.

Required simulation work:
- teams and sides;
- carryable objective;
- side-specific spawn rules;
- two-leg match scoring.

## Prioritization

Recommended order after UI/combat readability:

1. Survival polish and telemetry.
2. Circuit Teams — lowest conceptual distance from current simulation.
3. Core Rush — requires attribution/respawn but strongly changes match dynamics.
4. Grid Control.
5. Data Heist.
6. Data Harvest only after playtests verify that collection does not dilute combat.

## Explicit non-goals

Do not use:

- paid randomized gameplay rewards;
- hidden rubber-banding presented as fair competition;
- fake scarcity or expiring progress designed primarily to create anxiety;
- loss-streak punishment intended to force continued play;
- gameplay power sold for money;
- opaque engagement optimization that overrides player choice.

Retention should come from a strong game, social replay, mastery, expression, and meaningful mode variety.
