import { describe, expect, it } from "vitest";
import { fuseVisual, inferFacing, stableAnimationSeed } from "./animatedPresentation";

describe("animated presentation helpers", () => {
  it("infers cardinal facing from target movement", () => {
    expect(inferFacing(0, 0, 1, 0)).toBe("right");
    expect(inferFacing(1, 0, 0, 0)).toBe("left");
    expect(inferFacing(0, 0, 0, -1)).toBe("up");
    expect(inferFacing(0, 0, 0, 1)).toBe("down");
  });

  it("keeps the previous facing when there is no movement", () => {
    expect(inferFacing(3, 4, 3, 4, "left")).toBe("left");
  });

  it("increases fuse urgency as detonation approaches", () => {
    expect(fuseVisual(2200).urgency).toBe(0);
    expect(fuseVisual(1100).urgency).toBeCloseTo(0.5);
    expect(fuseVisual(0).urgency).toBe(1);
    expect(fuseVisual(0).pulseMs).toBeLessThan(fuseVisual(2200).pulseMs);
    expect(fuseVisual(0).ringRadius).toBeGreaterThan(fuseVisual(2200).ringRadius);
  });

  it("creates deterministic normalized animation seeds", () => {
    const first = stableAnimationSeed("player-1");
    expect(stableAnimationSeed("player-1")).toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(1);
  });
});
