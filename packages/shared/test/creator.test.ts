import { describe, expect, it } from "vitest";
import {
  approveCreatorCosmetic,
  createArenaFromMap,
  validateCreatorCosmetic,
  validateCreatorMap,
  type CreatorMapDefinition
} from "../src";

const validMap = (): CreatorMapDefinition => {
  const width = 9;
  const height = 9;
  const tiles = Array.from({ length: width * height }, () => "floor" as const);
  const index = (x: number, y: number) => y * width + x;

  for (let x = 0; x < width; x++) {
    tiles[index(x, 0)] = "hard";
    tiles[index(x, height - 1)] = "hard";
  }
  for (let y = 0; y < height; y++) {
    tiles[index(0, y)] = "hard";
    tiles[index(width - 1, y)] = "hard";
  }

  return {
    id: "map.creator-grid",
    version: 1,
    displayName: "Creator Grid",
    creatorId: "creator.one",
    width,
    height,
    tiles,
    spawnPoints: [{ x: 1, y: 1 }, { x: 7, y: 7 }]
  };
};

describe("creator content safety", () => {
  it("accepts a bounded connected declarative map", () => {
    const result = validateCreatorMap(validMap());
    expect(result.ok).toBe(true);
  });

  it("rejects extra executable/script-like fields", () => {
    const input = { ...validMap(), script: "alert(1)" };
    const result = validateCreatorMap(input);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/unsupported field/);
  });

  it("creates normal GameState from a validated map", () => {
    const state = createArenaFromMap(validMap(), ["p1", "p2"]);
    expect(state.players).toHaveLength(2);
    expect(state.width).toBe(9);
    expect(state.phase).toBe("playing");
  });

  it("rejects creator cosmetics that try to add gameplay fields", () => {
    const result = validateCreatorCosmetic({
      id: "avatar.creator-one",
      displayName: "Creator One",
      description: "visual only",
      creatorId: "creator.one",
      category: "avatar",
      visualToken: "creator-one",
      requestedPriceShells: 200,
      speedBonus: 10
    });
    expect(result.ok).toBe(false);
  });

  it("converts approved cosmetic metadata to gameplayEffect none", () => {
    const result = validateCreatorCosmetic({
      id: "avatar.creator-one",
      displayName: "Creator One",
      description: "visual only",
      creatorId: "creator.one",
      category: "avatar",
      visualToken: "creator-one",
      requestedPriceShells: 200
    });
    expect(result.ok).toBe(true);
    const approved = approveCreatorCosmetic(result.value!);
    expect(approved.item.rarity).toBe("CREATOR");
    expect(approved.item.gameplayEffect).toBe("none");
  });
});
