import { describe, expect, it } from "vitest";
import { OFFICIAL_MAPS, analyzeArenaBalance } from "../src";

describe("official arena balance metrics", () => {
  it("keeps spawn egress and spacing invariants across official maps", () => {
    for (const map of Object.values(OFFICIAL_MAPS)) {
      const metrics = analyzeArenaBalance(map);
      expect(metrics.minSpawnEgress).toBeGreaterThanOrEqual(2);
      expect(metrics.minSpawnManhattanDistance).toBeGreaterThanOrEqual(5);
      expect(metrics.spawnEgress).toEqual([2, 2, 2, 2, 3, 3, 3, 3]);
    }
  });

  it("records stable tile-density baselines for future tuning", () => {
    expect(analyzeArenaBalance(OFFICIAL_MAPS["grid-zero"])).toMatchObject({
      hardTiles: 80,
      softTiles: 50,
      floorTiles: 65,
      traversablePotentialTiles: 115
    });

    expect(analyzeArenaBalance(OFFICIAL_MAPS["data-cross"])).toMatchObject({
      hardTiles: 88,
      softTiles: 45,
      floorTiles: 62,
      traversablePotentialTiles: 107
    });

    expect(analyzeArenaBalance(OFFICIAL_MAPS.switchyard)).toMatchObject({
      hardTiles: 71,
      softTiles: 56,
      floorTiles: 68,
      traversablePotentialTiles: 124
    });
  });

  it("keeps authored soft-block ratios within the current reference band", () => {
    const ratios = Object.values(OFFICIAL_MAPS)
      .map((map) => analyzeArenaBalance(map).softRatioOfPotentialSpace);

    for (const ratio of ratios) {
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.46);
    }
  });
});
