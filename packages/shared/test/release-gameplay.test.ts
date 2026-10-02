import { describe, expect, it } from "vitest";
import {
  GAME,
  OFFICIAL_MAP_IDS,
  OFFICIAL_MAPS,
  createArena,
  createOfficialArena,
  indexOf,
  suddenDeathOrder,
  tickSimulation,
  validateCreatorMap
} from "../src";

describe("release gameplay", () => {
  it("keeps every official map within the creator-safe declarative contract", () => {
    for (const id of OFFICIAL_MAP_IDS) {
      const result = validateCreatorMap(OFFICIAL_MAPS[id]);
      expect(result.ok, `${id}: ${result.errors.join("; ")}`).toBe(true);
    }
  });

  it("creates an arena for every official map and supports eight players", () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`);
    for (const mapId of OFFICIAL_MAP_IDS) {
      const state = createOfficialArena(mapId, ids);
      expect(state.mapId).toBe(mapId);
      expect(state.players).toHaveLength(8);
      expect(new Set(state.players.map((p) => `${p.x},${p.y}`)).size).toBe(8);
    }
  });

  it("starts deterministic sudden death at the configured threshold", () => {
    const state = createArena(["p1", "p2"]);
    const first = suddenDeathOrder(state.width, state.height)[0];
    state.players[0].x = first.x;
    state.players[0].y = first.y;
    state.elapsedMs = state.suddenDeathStartMs - 1;

    tickSimulation(state, 1);

    expect(state.tiles[indexOf(state, first.x, first.y)]).toBe("hard");
    expect(state.players[0].alive).toBe(false);
    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBe("p2");
  });

  it("hard-stops a round at the target duration", () => {
    const state = createArena(["p1", "p2"]);
    state.suddenDeathStartMs = state.roundDurationMs + 1;
    state.elapsedMs = state.roundDurationMs - 1;

    tickSimulation(state, 1);

    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBeNull();
    expect(state.elapsedMs).toBe(GAME.targetMatchSeconds * 1000);
  });
});
