# Visual FX Phase 3 research

Date: 2026-10-03

## Goal
Add a stronger cyberpunk presentation layer without making gameplay readability or device performance depend on expensive effects.

## Findings
- W3C WCAG guidance for animation from interactions recommends that non-essential motion be disableable.
- MDN documents `prefers-reduced-motion` as the browser-level signal for users who request less non-essential motion.
- For browser games, a visual-quality ladder is preferable to a single mandatory effect stack because GPU/browser capability varies widely.
- NEON FUSE already has readable base silhouettes and bounded transient FX; Phase 3 should layer atmosphere over those rather than replace them.

## Decision
Use three persistent visual tiers:
- `low`: base presentation, reduced transient-FX budget, no movement trails or camera shake, minimal CRT overlay;
- `medium`: mild CRT, bloom-like glow and chromatic separation, normal bounded FX;
- `high`: stronger bloom-like glow/chromatic treatment, full bounded FX and restrained camera shake.

The browser/OS `prefers-reduced-motion` signal overrides non-essential movement independently of visual quality: camera shake and trails are disabled and ambient scan/pulse motion is frozen/reduced.

## Implementation posture
Phase 3 uses CSS/canvas composition rather than mandatory custom WebGL shader pipelines. This keeps the quality system functional across Canvas/WebGL renderer selection and preserves a low-cost fallback. A later profiling pass may add optional native Phaser/WebGL post-processing behind the same quality contract.

## Sources
- W3C, Understanding Success Criterion 2.3.3: Animation from Interactions.
- MDN, `prefers-reduced-motion` CSS media feature.
- W3C Web Sustainability Guidelines, animation proportionality/control/performance guidance.
