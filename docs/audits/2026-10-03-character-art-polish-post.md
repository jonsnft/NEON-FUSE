# Character art polish post-audit — 2026-10-03

## Result
The production character presentation has been expanded without changing simulation, protocol or server authority.

## Implemented
- production sheet expanded to 106 fixed 48x48 frames;
- two idle frames and four walk frames for each facing direction;
- separate cyan, lime and ghost avatar artwork in the sheet;
- four-frame elimination presentation driven by the existing alive-state transition;
- three-frame Energy Core placement presentation driven by first observation of a new authoritative core;
- existing four-stage fuse urgency retained;
- persistent Phaser images retained for tiles, players, cores and pickups;
- reduced-motion / LOW-quality modes freeze nonessential frame cycling while preserving readable elimination and fuse state;
- frame-index contract covered by unit tests;
- fixed-grid sheet manifest documents the 106-frame layout.

## Authority review
No changes were made to shared simulation types, movement, collision, blast resolution, Core timing, protocol messages or server room logic. All new timestamps are client presentation timestamps and cannot feed back into game state.

## Verification
GitHub Actions CI run #101 passed:
- pnpm install --no-frozen-lockfile
- pnpm architecture:guard
- pnpm typecheck
- pnpm test
- pnpm build
- docker compose config
- server Docker image build
- client Docker image build

## Manual test focus
- all four movement directions cycle through four distinct walk poses;
- idle animation remains subtle and facing persists;
- cyan/lime/ghost cosmetics are visibly different without relying on runtime tint alone;
- eliminated players show a brief readable signal-break sequence instead of disappearing immediately;
- new Energy Cores show a short placement beat before normal fuse urgency;
- LOW quality and macOS reduced-motion settings remain stable and readable.
