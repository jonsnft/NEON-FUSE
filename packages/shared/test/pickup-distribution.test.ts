import { describe, expect, it } from "vitest";
import { distributePickups, targetPickupCount } from "../src";

describe("pickup distribution", () => {
  it("scales with soft-block density instead of only item variety", () => {
    expect(targetPickupCount(60, 2, 3)).toBe(13);
    expect(targetPickupCount(60, 8, 3)).toBe(16);
  });

  it("keeps every enabled pickup kind represented", () => {
    const cells = Array.from({ length: 30 }, (_, index) => ({
      x: index % 10,
      y: Math.floor(index / 10)
    }));

    const pickups = distributePickups(cells, 2, ["range", "capacity", "speed"]);

    expect(pickups.length).toBeGreaterThan(3);
    expect(new Set(pickups.map((pickup) => pickup.kind))).toEqual(
      new Set(["range", "capacity", "speed"])
    );
    expect(new Set(pickups.map((pickup) => `${pickup.x},${pickup.y}`)).size).toBe(pickups.length);
  });

  it("respects no-items and reduced item presets", () => {
    const cells = Array.from({ length: 30 }, (_, index) => ({ x: index, y: 1 }));

    expect(distributePickups(cells, 2, [])).toEqual([]);
    expect(distributePickups(cells, 2, ["range", "capacity"]).every(
      (pickup) => pickup.kind !== "speed"
    )).toBe(true);
  });
});
