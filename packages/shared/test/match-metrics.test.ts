import { describe, expect, it } from "vitest";
import {
  createOfficialArena,
  metricsForPlayer,
  movePlayer,
  placeCore,
  tickSimulation
} from "../src";

const standardRules = {
  itemPresetId: "standard" as const,
  modifierPresetId: "standard" as const,
  pacePresetId: "standard" as const
};

describe("authoritative match metrics", () => {
  it("records successful Core placements", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], standardRules);

    expect(placeCore(state, "p1")).toBe(true);
    expect(metricsForPlayer(state, "p1")?.coresPlaced).toBe(1);
    expect(metricsForPlayer(state, "p2")?.coresPlaced).toBe(0);
  });

  it("records pickup collection by kind", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], standardRules);
    const player = state.players[0];
    player.x = 1;
    player.y = 1;
    state.pickups = [{ x: 2, y: 1, kind: "range", revealed: true }];

    expect(movePlayer(state, "p1", "right")).toBe(true);
    expect(metricsForPlayer(state, "p1")?.pickupsCollected).toEqual({
      range: 1,
      capacity: 0,
      speed: 0
    });
  });

  it("records chain detonations and blast elimination timing", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], standardRules);
    state.players[0].x = 1;
    state.players[0].y = 1;
    state.players[1].x = 13;
    state.players[1].y = 11;
    state.cores = [
      { id: "core-a", ownerId: "p1", x: 1, y: 1, fuseMs: 0, blastRange: 2 },
      { id: "core-b", ownerId: "p2", x: 2, y: 1, fuseMs: 9999, blastRange: 1 }
    ];

    tickSimulation(state, 50);

    expect(state.metrics.chainDetonations).toBe(1);
    expect(metricsForPlayer(state, "p1")?.eliminatedAtMs).toBe(50);
    expect(metricsForPlayer(state, "p2")?.eliminatedAtMs).toBeNull();
  });

  it("records whether standard rules reach Sudden Death", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], standardRules);
    state.elapsedMs = state.suddenDeathStartMs - 1;

    tickSimulation(state, 1);

    expect(state.metrics.reachedSuddenDeath).toBe(true);
  });

  it("does not mark Sudden Death when the modifier disables it", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], {
      ...standardRules,
      modifierPresetId: "no-sudden-death"
    });
    state.elapsedMs = state.suddenDeathStartMs - 1;

    tickSimulation(state, 1);

    expect(state.metrics.reachedSuddenDeath).toBe(false);
  });
});
