# Research note: configurable multiplayer lobby rules

Date: 2026-10-03

## Question
How should NEON FUSE expose creator-controlled lobby configuration for player capacity, map, items and future game modifiers without weakening server authority or creating confusing Ready/Start semantics?

## Sources reviewed

### Open-source multiplayer lobby reference
`tngklp/godot-multiplayer-lobby-system` documents a server-authoritative lobby with configurable player limits, player Ready state, host-controlled Start, host migration and lobby/game separation.

Source: https://github.com/tngklp/godot-multiplayer-lobby-system

Useful pattern for NEON FUSE:
- lobby configuration belongs to authoritative room state rather than client-local UI state;
- host/creator permissions are validated on the server;
- Ready is a distinct state from Start;
- the game scene begins from an accepted lobby state rather than directly from client-selected parameters.

### CHI 2026: player authorship through rule-changing play
"Player Discretion is Advised: Designing for Rule-Changing Play" reports design themes around player authorship, including opening rules and parameters to players and bringing internal rules to the surface.

Source: https://doi.org/10.1145/3772318.3791736

Interpretation for NEON FUSE:
- creator-controlled match options should be visible and explicit;
- configuration should use understandable named parameters/presets rather than hidden adjustments;
- players should know the current rule set before committing Ready.

### Competitive multiplayer difficulty research
Baldwin et al. reviewed multiplayer dynamic difficulty adjustment and emphasize that challenge balancing in competitive multiplayer is structurally different from single-player difficulty adjustment.

Source: https://doi.org/10.1109/IGIC.2013.6659150

Interpretation for this architecture step:
- do not silently alter competitive rules after the match starts;
- if future balancing modifiers are introduced, make them explicit lobby rules or separately researched systems.

## Existing NEON FUSE constraints
- Server-authoritative Colyseus room.
- Creator explicitly starts only after every connected player is Ready.
- Current room capacity is bounded to 2–8 players.
- Three official maps exist.
- Current pickups are range, capacity and speed.
- Sudden death currently starts deterministically during a four-minute round.
- Lobby chat is a separate non-simulation channel.

## Decision derived from research
Introduce a server-owned `LobbyConfig` that is mutable only while waiting and only by the current creator.

Initial configuration dimensions:
1. **Player capacity** — integer 2–8, never below current connected player count.
2. **Map** — official allowlisted map ID.
3. **Item preset** — named allowlisted preset controlling which pickup kinds can spawn.
4. **Modifier preset** — named allowlisted preset; initial modifier dimension controls sudden-death behavior.

Every accepted configuration change clears all Ready votes. This makes Ready mean "I accept the exact configuration currently shown".

## Initial presets
### Items
- `standard`: range + capacity + speed
- `no-speed`: range + capacity
- `no-items`: no pickups

These are deliberately coarse presets. Individual per-item probability sliders are deferred until pickup distribution itself is researched and playtested.

### Modifiers
- `standard`: deterministic sudden death enabled
- `no-sudden-death`: sudden death disabled; the existing hard round deadline remains

Additional modifiers such as fuse duration, blast behavior, movement speed, starting capacity or team rules are deferred. Each can materially change game balance and should receive its own research/playtest record before becoming a creator option.

## Matchmaking consequence
Map can no longer be a matchmaking filter because the creator may change it while the room is waiting. Room discovery should show current authoritative metadata; Quick Match should join/create a generic waiting room, then the creator configures it in-room.

## Rejected alternatives
- **Client-local lobby settings:** rejected because clients could disagree and server validation would be ambiguous.
- **Arbitrary numeric sliders for all rules:** rejected for the first implementation because they greatly expand the balance/test matrix.
- **Keeping Ready votes after rule changes:** rejected because Ready would no longer represent consent to the displayed rule set.
- **Hidden mid-match dynamic balancing:** outside this step and inconsistent with the current transparent competitive model.

## Follow-up evidence needed
Before adding further gameplay modifiers, research and playtest each modifier's effect on match duration, comeback potential, skill expression and spawn fairness. Record measured outcomes in `docs/research/` before promotion into the supported lobby configuration catalog.
