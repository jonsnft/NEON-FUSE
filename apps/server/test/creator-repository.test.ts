import { describe, expect, it } from "vitest";
import { LocalCreatorContentRepository } from "../src/creator/LocalCreatorContentRepository";
import type { CreatorMapDefinition } from "@neon-fuse/shared";

function mapFixture(): CreatorMapDefinition {
  const width = 9;
  const height = 9;
  const tiles = Array.from({ length: width * height }, (_, i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    return x === 0 || y === 0 || x === width - 1 || y === height - 1 ? "hard" : "floor";
  }) as CreatorMapDefinition["tiles"];

  return {
    id: "map.local-test",
    version: 1,
    displayName: "Local Test",
    creatorId: "creator.test",
    width,
    height,
    tiles,
    spawnPoints: [{ x: 1, y: 1 }, { x: 7, y: 7 }]
  };
}

describe("creator moderation repository", () => {
  it("does not publish pending maps", async () => {
    const repo = new LocalCreatorContentRepository();
    await repo.submitMap(mapFixture());
    expect(await repo.listApprovedMaps()).toEqual([]);
  });

  it("publishes only after server-owned approval", async () => {
    const repo = new LocalCreatorContentRepository();
    await repo.submitMap(mapFixture());
    await repo.moderateMap("map.local-test", "approved");
    expect((await repo.listApprovedMaps()).map((m) => m.id)).toEqual(["map.local-test"]);
  });
});
