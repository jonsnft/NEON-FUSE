# Creator Start Gate Preflight Audit — 2026-10-03

## User-observed problem
The current room starts immediately when every currently connected player is ready. With two early arrivals this can start the match before the intended group has joined.

## Required behavior
- Ready means player consent only.
- The first room participant is the room creator/host.
- All connected players must be ready before start becomes legal.
- Even when all are ready, the match remains waiting.
- Only the creator may explicitly release/start the match.
- Server validates the start request; the client cannot declare a start outcome.

## Architecture verdict
No ADR change required.

This strengthens the existing server-authoritative room lifecycle. It does not change deterministic gameplay, maps, economy, cosmetics or platform integration.

## Minimal protocol extension
- add `match.start` client intent;
- expose `creatorPlayerId` in waiting snapshots.

## Server invariants
A start is accepted only when:
1. no game is already active;
2. requester equals server-owned creatorPlayerId;
3. connected player count is at least MIN_PLAYERS;
4. every connected player ID is present in readyIds.

Creator identity is assigned by the server to the first player who joins the room. If that creator leaves before the round begins, ownership transfers deterministically to the first remaining connected client.

## Scope exclusion
No graphics redesign, additional gameplay mechanics, economy work, creator marketplace work or PlayBay integration in this change.
