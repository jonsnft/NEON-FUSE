# Phase 6 Preflight Audit — 2026-10-02

## Scope
Creator maps and creator cosmetics.

## Baseline invariants
- Server-authoritative match outcomes.
- Grid simulation is deterministic.
- Maps are declarative data, never executable code.
- Cosmetics cannot affect gameplay.
- External platform/storage/moderation systems remain behind adapters.

## Architecture verdict
**No ADR change required.**

The existing Architecture document explicitly reserves extension points for declarative maps and data-driven cosmetics. Phase 6 implements those extension points.

## Security model
Creator submissions are untrusted input.

A creator payload must be rejected unless:
- it matches a strict allowlisted schema;
- dimensions/counts stay within bounded limits;
- map borders/spawns/connectivity are valid;
- identifiers and visual tokens use bounded safe character sets;
- no arbitrary URLs, scripts, code, HTML, shaders or executable graph data are accepted;
- moderation state is server-owned, not creator-supplied;
- only approved content may enter production registries.

## Non-goals
- arbitrary user JavaScript;
- arbitrary Phaser scenes;
- arbitrary remote asset URLs;
- arbitrary Comfy/workflow graphs;
- publishing to PlayBay before its contract is verified.
