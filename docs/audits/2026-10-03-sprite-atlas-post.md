# Sprite atlas post-audit — 2026-10-03

## Result
Implemented the first production sprite-atlas path for NEON FUSE.

## Delivered
- versioned PNG atlas plus JSON frame metadata;
- map-specific floor/hard/soft tile frames for Grid Zero, Data Cross and Switchyard;
- four-direction player idle/move frames;
- four Energy Core urgency frames;
- two-frame range/capacity/speed pickup animation;
- persistent `SpriteAtlasLayer` that reuses tile Images and synchronizes dynamic entities;
- atlas preload in offline, lobby and online scenes;
- automatic fallback to `CyberpunkAssetLayer` when the texture is unavailable;
- quality/reduced-motion-aware frame cycling;
- tests for frame naming and reduced-motion frame behavior;
- ADR 0013 documenting the presentation boundary.

## Authority check
No shared simulation, protocol, server room logic or input authority was changed. Facing and animation phase remain client presentation state. Core urgency reads the existing authoritative `fuseMs` value.

## Verification
GitHub Actions CI run #98 passed:
- dependency install;
- architecture guard;
- TypeScript typecheck;
- tests;
- production build;
- Docker Compose validation;
- server Docker image build;
- client Docker image build.

## Follow-up
Manual visual review should compare sprite readability and effect layering on macOS and the Raspberry Pi. A later art pass can replace atlas pixels without changing the frame contract or gameplay code.
