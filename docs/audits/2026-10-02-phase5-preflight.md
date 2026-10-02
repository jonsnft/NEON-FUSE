# Phase 5 Preflight Audit — 2026-10-02

## Planned scope
Strengthen verification and architecture enforcement without changing gameplay or product rules.

## Goals
- Boot the real Colyseus application in tests.
- Connect two SDK clients.
- Exercise ready -> playing state over the actual room protocol.
- Add static architecture guards for forbidden dependencies in deterministic simulation.
- Keep deployment/runtime verification separate from gameplay design.

## Architecture guard invariants
`packages/shared/src/sim/**` must not depend on:
- Phaser
- Colyseus
- OpenMayhem
- PlayBay
- Stripe/payment code
- cosmetic catalog or entitlement modules

This protects ADR-0002, ADR-0003, ADR-0004 and ADR-0005 mechanically.

## Test dependency
Use `@colyseus/testing` in the 0.17-compatible line, matching the server's Colyseus 0.17 stack.

## Verdict
No architecture change required.
