# Roadmap

## Phase 0 — Foundation
- repository structure
- architecture/ADRs
- build/typecheck/test baseline
- shared protocol package

## Phase 1 — Offline playable core
- 15×13 map
- player movement
- hard/soft blocks
- core placement
- fuse/explosion propagation
- chain reactions
- three match power-ups
- elimination + winner

## Phase 2 — Authoritative multiplayer
- Colyseus room
- two clients
- input validation
- authoritative tick
- reconnect
- interpolation

## Phase 3 — Match productization
- lobby/ready flow
- 2–4 then 2–8 players
- timer
- sudden death
- rematch
- spectator state

## Phase 4 — Content
- original art direction
- audio
- multiple maps
- cosmetics manifest
- profile/inventory abstraction

## Phase 5 — Platform integration
- verify PlayBay game contract
- verify item/entitlement contract
- platform adapter
- test item purchase/ownership flow
- telemetry

## Phase 6 — Creator layer
- safe map schema
- map validation
- creator cosmetics pipeline
- moderation hooks

## MVP success criteria
A player can open the browser, join a room, understand controls immediately, complete a fair 3–5 minute multiplayer round and choose to rematch.
