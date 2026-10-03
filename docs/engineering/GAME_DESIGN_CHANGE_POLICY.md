# Game design change policy

Status: Active

## Purpose
NEON FUSE treats gameplay rules, lobby behavior, content structure and progression-facing systems as product architecture. Decisions must remain reproducible from GitHub rather than existing only in chat history.

## Required workflow
For every material change to gameplay, lobby rules, maps, items, match flow, creator content or economy-adjacent behavior:

1. **Research** — review relevant primary documentation, credible studies and/or maintained open-source implementations.
2. **Research note** — record sources, observed patterns, uncertainties and the NEON FUSE interpretation under `docs/research/`.
3. **Architecture/design decision** — create or update an ADR when the change establishes a durable boundary, authority rule, protocol contract or data model.
4. **Implementation** — keep the smallest coherent change behind explicit types/validation.
5. **Verification** — architecture guard, typecheck, tests, production build and release packaging gates must stay green.
6. **Post-audit** — document what changed, what deliberately did not change, and any remaining follow-up.

## Source discipline
- Prefer primary technical documentation and peer-reviewed or institutional research when available.
- Open-source projects are implementation references, not automatically design authority.
- Historical games may inform abstract mechanics, but NEON FUSE must not copy protected characters, names, graphics, audio, maps or distinctive content.
- If evidence is weak or conflicting, record the uncertainty instead of presenting an assumption as established fact.

## Product discipline
- Competitive outcomes remain server-authoritative.
- Player-facing rule changes must be visible before Ready/Start.
- Material lobby configuration changes invalidate existing Ready votes.
- Mid-match hidden rule mutation is avoided unless separately researched, documented and explicitly designed.
- Monetized content remains cosmetic-only unless a future ADR explicitly changes that policy.

## GitHub record
The repository is the canonical record for architecture, research notes, rule contracts, implementation and audits. Chat discussion may motivate a change but is not the durable source of truth.
