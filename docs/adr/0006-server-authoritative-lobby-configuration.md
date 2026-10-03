# ADR 0006: Server-authoritative lobby configuration

Status: Accepted

## Decision
Match configuration is authoritative room state owned by the server. Only the current room creator may change configuration while the room is waiting.

`LobbyConfig` contains the supported player capacity, official map, item preset and modifier preset. Clients request changes; the server validates and broadcasts the accepted configuration.

Any accepted configuration change clears all Ready votes. Match start still requires the minimum player count, every connected player Ready, and an explicit creator Start action.

## Rationale
A configurable party game needs player authorship without allowing clients to define competitive outcomes independently. Treating Ready as acceptance of a specific visible rule set avoids stale consent after host changes. Named allowlisted presets keep the initial balance/test matrix bounded and reproducible.

Map is not a matchmaking filter because it can change while the room is waiting. Room discovery reads current authoritative metadata instead.

## Consequences
- Lobby configuration is separate from deterministic movement/core intents.
- Creator-only mutations are server-validated.
- Capacity cannot be reduced below the current connected player count.
- The selected rules are copied into the created `GameState` for debugging/replay transparency.
- Item and modifier catalogs are explicit shared data.
- Adding a new gameplay modifier requires research, catalog definition, simulation support and tests before it becomes selectable.
- Existing Ready votes are invalid after any accepted configuration mutation.
