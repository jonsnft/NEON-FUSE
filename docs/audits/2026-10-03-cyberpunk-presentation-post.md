# Cyberpunk presentation post-audit

Date: 2026-10-03
Branch: `feature/cyberpunk-presentation-layer`
Status: Pending final CI

## Implemented
- client-only `NeonWorldRenderer` presentation layer;
- frame-rate visual interpolation toward authoritative player tile positions;
- centralized cyberpunk palette and motion tokens;
- continuous ambient scan/pulse animation;
- layered visual treatment for floor, hard/soft blocks, pickups, Cores, blasts and players;
- existing cosmetic visual tokens preserved as presentation modifiers;
- offline and online game scenes now use the same renderer;
- browser shell receives restrained cyan/magenta atmosphere and scanline treatment.

## Authority audit
No shared simulation, protocol or server files were changed. The renderer receives `GameState` as read-only presentation input and stores its own visual coordinates. Visual coordinates are not used for intents, collision, Core placement or hit resolution.

## Performance posture
Phase 1 uses a single Phaser Graphics surface and normal draw calls. No unbounded particles and no custom shader/post-FX dependency were added. GPU bloom/CRT remains deferred to an optional quality tier.

## Deliberately deferred
- imported production sprite/texture art;
- semantic event particle systems and movement trails;
- camera impact/shake;
- GPU bloom, distortion or chromatic aberration;
- reduced-motion/quality settings;
- complete lobby/store visual redesign.

## Verification
Pending architecture guard, typecheck, tests, production build, Compose validation and both Docker image builds.