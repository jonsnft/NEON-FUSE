# Animated character art post-audit — 2026-10-03

## Implemented
- Four-direction player facing inferred from authoritative target movement.
- Client-only idle and movement animation with stable per-player phase seeds.
- Direction-specific visor, chassis, shoulder, and leg presentation.
- Energy Core urgency animation derived from remaining authoritative `fuseMs`.
- Animated pickup glyph geometry and optional orbit markers.
- Reduced-motion integration for the production asset layer, including frozen ambient tile/pickup/player motion while retaining static gameplay cues.
- Low-quality mode suppresses secondary animated detail while preserving core readability.
- Unit coverage for facing inference, fuse urgency mapping, and deterministic animation seeds.

## Authority / architecture check
No simulation, protocol, server, input, or platform-adapter behavior changed. Facing, idle/move phase, and presentation seeds exist only in the client renderer. Energy Core timing reads existing `fuseMs` and never feeds state back into the simulation.

## Verification
CI run #95 passed the implementation head:
- dependency install
- architecture guard
- TypeScript typecheck
- tests
- production build
- Docker Compose validation
- server Docker image build
- client Docker image build

A final CI run is required for this documentation-only head before merge.

## Manual verification target
After merge, verify on the MacBook LAN client:
- all four facing silhouettes,
- idle-to-move transitions,
- Core pulse acceleration near detonation,
- pickup glyph animation,
- `V` quality cycling,
- macOS Reduced Motion behavior,
- stable multiplayer interpolation.
