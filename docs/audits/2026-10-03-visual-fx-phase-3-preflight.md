# Visual FX Phase 3 preflight

Date: 2026-10-03

## Scope
Client-only visual quality system, CRT/bloom/chromatic composition and reduced-motion fallback.

## Constraints
- no shared simulation/protocol/server changes;
- base silhouettes remain readable with all effects disabled;
- visual settings never alter match state;
- reduced motion disables non-essential camera/trail/ambient movement;
- low tier must remain viable on weaker browsers/devices;
- quality choice persists locally only.

## Planned verification
Architecture guard, typecheck, tests, production build, Compose validation and both release container builds.
