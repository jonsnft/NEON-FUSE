import { describe, expect, it } from "vitest";
import {
  createOfficialArena,
  metricsForPlayer,
  scoreForPlayer,
  tickSimulation,
  tileAt
} from "../src";

const rules = {
  gameModeId: "grid-control" as const,
  itemPresetId: "standard" as const,
  modifierPresetId: "standard" as const,
  pacePresetId: "standard" as const
};

describe("grid control", () => {
  it("creates three deterministic walkable data nodes", () => {
    const first = createOfficialArena("grid-zero", ["p1", "p2"], rules);
    const second = createOfficialArena("grid-zero", ["p1", "p2"], rules);

    expect(first.controlNodes).toHaveLength(3);
    expect(first.controlNodes.map(({ x, y }) => [x, y])).toEqual(
      second.controlNodes.map(({ x, y }) => [x, y])
    );
    expect(new Set(first.controlNodes.map((node) => `${node.x},${node.y}`)).size).toBe(3);
    expect(first.controlNodes.every((node) => tileAt(first, node.x, node.y) === "floor")).toBe(true);
  });

  it("requires capture time before an uncontested live link scores sync", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules);
    const node = state.controlNodes[0];
    const p1 = state.players[0];
    p1.x = node.x;
    p1.y = node.y;

    tickSimulation(state, 1_000);

    expect(node.ownerId).toBe("p1");
    expect(metricsForPlayer(state, "p1")?.nodesCaptured).toBe(1);
    expect(scoreForPlayer(state, "p1")).toBe(0);

    tickSimulation(state, 1_000);

    expect(scoreForPlayer(state, "p1")).toBe(1);
  });

  it("pauses capture while a data node is contested", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules);
    const node = state.controlNodes[0];
    for (const player of state.players) {
      player.x = node.x;
      player.y = node.y;
    }

    tickSimulation(state, 2_000);

    expect(node.ownerId).toBeNull();
    expect(node.captureProgressMs).toBe(0);
    expect(scoreForPlayer(state, "p1")).toBe(0);
    expect(scoreForPlayer(state, "p2")).toBe(0);
  });

  it("lets an opponent overwrite a captured node", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules);
    const node = state.controlNodes[0];
    const [p1, p2] = state.players;

    p1.x = node.x;
    p1.y = node.y;
    tickSimulation(state, 1_000);
    expect(node.ownerId).toBe("p1");

    p1.x = p1.spawnX;
    p1.y = p1.spawnY;
    p2.x = node.x;
    p2.y = node.y;
    tickSimulation(state, 1_000);

    expect(node.ownerId).toBe("p2");
    expect(metricsForPlayer(state, "p2")?.nodesCaptured).toBe(1);
  });

  it("ends the round when a player reaches the sync target", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules);
    const node = state.controlNodes[0];
    const p1 = state.players[0];
    const metrics = metricsForPlayer(state, "p1")!;
    metrics.objectivePoints = 29;
    node.ownerId = "p1";
    p1.x = node.x;
    p1.y = node.y;

    tickSimulation(state, 1_000);

    expect(scoreForPlayer(state, "p1")).toBe(30);
    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBe("p1");
  });
});
