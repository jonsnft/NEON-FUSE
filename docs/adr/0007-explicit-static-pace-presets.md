# ADR 0007: Explicit static pace presets

Status: Accepted
Date: 2026-10-03

## Context
Core fuse timing materially changes reaction windows, trap viability, chain-reaction planning and accessibility. The existing implementation hard-codes a 1800 ms fuse. The Creator lobby now supports explicit, server-authoritative rules, so timing belongs in the same validated rule contract rather than in client-side UI or hidden simulation constants.

Research recorded in `docs/research/2026-10-03-core-pacing-and-arena-balance.md` found useful external reference ranges but no universal optimum for NEON FUSE.

## Decision
Introduce a shared `pacePresetId` as part of `GameRules`.

Initial allowlist:
- `standard` — 1800 ms Core fuse; preserves the existing tested behavior.
- `tactical` — 2400 ms Core fuse; an explicit playtest hypothesis with a larger planning/reaction window.

The preset is selected pre-match only. The authoritative server validates the value and copies it into `GameState.rules`. Core placement resolves fuse duration from the authoritative game rules. Clients never send raw fuse values.

A pace change while waiting is material and therefore clears Ready votes.

## Deliberately unchanged
- movement cadence and speed tiers;
- initial blast range;
- initial Core capacity;
- authored official-map topology;
- pickup categories/distribution;
- round duration;
- Sudden Death timing and contraction;
- cosmetics/economy/platform boundaries.

## Consequences
- Match state fully records the pace preset needed to reproduce Core timing.
- Creator configuration remains a bounded allowlist rather than arbitrary numeric sliders.
- More pacing presets can be added later only through research, validation and tests.
- Raw timing parameters remain server/shared-domain concerns and are not accepted from clients.

## Follow-up
Add deterministic arena-balance metrics before changing block density, spawn geometry or pickup density.