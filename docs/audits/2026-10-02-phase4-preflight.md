# Phase 4 Preflight Audit — 2026-10-02

## Planned scope
Add cosmetic catalog, loadout/inventory abstractions, and original presentation metadata without modifying competitive game rules.

## Architecture constraints
- ADR-0002: server remains authoritative for competitive outcomes.
- ADR-0003: cosmetics must not enter deterministic collision/damage rules.
- ADR-0004: cosmetics cannot change combat power, readability-critical collision, speed, capacity or blast range.
- ADR-0005: inventory/entitlement source is an adapter; PlayBay-specific APIs remain unimplemented until a verified contract exists.

## Boundary decision
Cosmetic loadouts are presentation metadata transported beside the authoritative game snapshot, not fields used by the shared simulation.

## Initial catalog
First-party original items only:
- avatar shell variants
- Energy Core visual skins
- blast visual themes
- movement trail metadata
- victory effect metadata

## External research status
Current public web research did not expose a verifiable PlayBay game-item/entitlement API contract. Therefore Phase 4 uses a typed provider interface and a local in-memory implementation only. No guessed PlayBay endpoint or authentication flow will be committed.

## Verdict
No ADR change required.
