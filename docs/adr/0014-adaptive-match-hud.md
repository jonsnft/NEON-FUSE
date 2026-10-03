# ADR 0014: Adaptive match HUD outside the arena

## Status
Accepted

## Context
The match HUD was rendered as one or two long text lines at the top-left of the Phaser canvas. On the official maps this overlapped the first arena rows, reduced combat readability, and made end-of-round states such as `ROUND LOST` visually compete with tile art.

Desktop testing on Raspberry Pi and macOS also shows substantial unused horizontal canvas space to the right of the arena.

## Decision
Introduce a reusable client-only `MatchHud` presentation component.

- When at least 250 px are available to the right of the arena, render a dedicated side rail there.
- On narrower viewports, fall back to a compact top panel.
- Separate eyebrow/context, primary state, secondary match information, and controls into distinct typographic levels.
- Use cyan for normal state, lime for positive/ready/win state, and magenta for danger/elimination/loss state.
- Show alive-player count during play and spectator state after elimination.
- Give finished rounds a dedicated `ROUND COMPLETE` hierarchy with rematch controls.
- Keep the HUD entirely client-side; no simulation or network protocol fields are added.

## Consequences
Arena tiles remain unobscured in the common wide layout. Match state is quicker to scan, and elimination/end-of-round states are more legible. The same component is reused by online and offline scenes.
