# Roadmap

## Phase 0 — Foundation — COMPLETE
- repository structure
- architecture/ADRs
- build/typecheck/test baseline
- shared protocol package

## Phase 1 — Offline playable core — COMPLETE
- 15×13 map
- player movement
- hard/soft blocks
- core placement
- fuse/explosion propagation
- chain reactions
- three match power-ups
- elimination + winner

## Phase 2 — Authoritative multiplayer — COMPLETE
- Colyseus room
- multiplayer clients
- input validation
- authoritative tick
- reconnect
- authoritative state rendering

## Phase 3 — Match productization — COMPLETE
- lobby/ready flow
- 2–8 players
- rematch
- spectator state
- realtime room listing

## Phase 4 — Content — COMPLETE FOR RELEASE CANDIDATE
- original procedural art direction
- procedural audio cues
- three official validated maps
- cosmetics manifest
- profile/inventory abstraction

## Phase 5 — Platform integration — PARTIAL / EXTERNALLY BLOCKED
Complete internally:
- platform service adapter boundary
- local identity/entitlement implementation
- telemetry abstraction
- fail-closed production mode

Blocked on authoritative PlayBay developer contract:
- PlayBay identity token validation
- purchase/receipt verification
- production item entitlement lookup
- item publication/purchase flow

See `docs/integrations/PLAYBAY_VERIFICATION.md`.

## Phase 6 — Creator layer — COMPLETE FOR SAFE DOMAIN PRIMITIVES
- safe declarative map schema
- map validation/connectivity limits
- creator cosmetics validation
- server-owned moderation states
- approved-only repository queries

External publishing/storage remains behind adapters.

## Phase 7 — Release gameplay / operations — IN PROGRESS
- four-minute round timer
- deterministic Sudden Death from minute three
- official map selection through server allowlist
- timer/map/Sudden-Death HUD
- procedural match SFX
- health endpoint
- runtime environment validation
- operations/smoke-test runbook

## MVP success criteria
A player can open the browser, join a room, understand controls immediately, complete a fair 3–5 minute multiplayer round, see a deterministic result and choose to rematch.

## Release blockers outside this repository
- authoritative PlayBay integration contract for real item commerce/entitlements
- production hosting/environment selection and credentials
