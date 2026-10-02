# NEON FUSE

NEON FUSE is a browser-first, server-authoritative multiplayer arena game inspired by the fast, readable grid-based party games of the 1980–2001 era, while using an original IP, original art direction, original world, original characters, and original content.

## Product thesis

- 2–8 players for the first public release; architecture should allow later expansion.
- 3–5 minute matches.
- Grid movement, timed energy cores, directional blasts, destructible blocks, pickups, traps and chain reactions.
- Fair competitive gameplay: monetization is cosmetic-first and must not buy combat power.
- Browser-first distribution with a compact, low-friction onboarding loop.
- PlayBay-ready item catalog and creator economy, but platform-specific payment integration remains isolated behind adapters until the public contract is verified.

## Technical baseline

- TypeScript
- Phaser for browser game rendering and input
- Colyseus for authoritative multiplayer rooms/state synchronization
- Node.js server runtime
- Vite for client development/build
- Shared protocol/types package
- Deterministic grid simulation independent from rendering

See `docs/` for the persistent project memory, architectural decisions and roadmap.
