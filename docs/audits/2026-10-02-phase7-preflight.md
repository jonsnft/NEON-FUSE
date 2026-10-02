# Phase 7 Preflight Audit — 2026-10-02

## Scope
Close release-gameplay gaps already specified by the product baseline:
- round timer;
- deterministic sudden death;
- multiple official maps;
- lobby map selection;
- release/runbook hardening.

## Baseline gap
ROADMAP Phase 3 names timer and sudden death, but current shared simulation only tracks elapsed time and never contracts the arena or enforces a round deadline.

ROADMAP Phase 4 names multiple maps, but MatchRoom always calls the single default arena generator.

## Architecture verdict
**No ADR change required.**

These are missing product requirements, not new architectural directions.

## Invariants
- Timer and sudden death execute only in `packages/shared`.
- MatchRoom does not duplicate gameplay rules.
- Sudden-death order is deterministic from map geometry.
- Official maps use the same validated declarative map shape as creator maps.
- Map choice is server-admitted from an allowlisted catalog.
- Client only requests a map ID for room creation; it cannot submit map geometry.
