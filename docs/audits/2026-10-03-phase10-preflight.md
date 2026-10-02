# Phase 10 Preflight Audit — 2026-10-03

## Scope
Final internal release verification: exercise the real Colyseus runtime with two clients and mechanically guard the deterministic simulation boundary.

## Origin
An older divergent draft PR contained useful verification work that was never integrated. This phase ports only the still-relevant safeguards onto current `main`.

## Architecture verdict
**No ADR change required.**

## Runtime test goals
- boot the current real `app.config`;
- create a `match` room with an allowlisted `mapId`;
- connect two SDK clients;
- prove the match remains waiting until both clients ready;
- prove authoritative playing snapshot contains both players and server-resolved presentations.

## Architecture guard goals
`packages/shared/src/sim/**` must remain free of:
- Phaser rendering dependencies;
- Colyseus transport dependencies;
- PlayBay/OpenMayhem platform coupling;
- payment provider coupling;
- cosmetics/catalog coupling;
- entitlement coupling.

## Constraints
- use `@colyseus/testing` only as a server dev dependency;
- no production runtime dependency is added;
- no gameplay behavior is changed to satisfy tests;
- any lifecycle adaptation must reflect legitimate server disposal/reconnection behavior.
