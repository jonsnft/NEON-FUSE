import { describe, expect, it } from "vitest";
import {
  createOfficialArena,
  gameModePolicyForRules,
  metricsForPlayer,
  scoreForPlayer,
  suddenDeathEnabledForRules,
  tickSimulation
} from "../src";

const rules = (gameModeId: "survival" | "core-rush") => ({
  gameModeId,
  itemPresetId: "standard" as const,
  modifierPresetId: "standard" as const,
  pacePresetId: "standard" as const
});

function armElimination(state: ReturnType<typeof createOfficialArena>, ownerId: string, victimId: string): void {
  const owner = state.players.find((player) => player.id === ownerId)!;
  const victim = state.players.find((player) => player.id === victimId)!;
  owner.x = 5;
  owner.y = 5;
  victim.x = 2;
  victim.y = 1;
  victim.spawnX = 2;
  victim.spawnY = 1;
  state.cores.push({
    id: `core-${state.nextCoreId++}`,
    ownerId,
    x: 1,
    y: 1,
    fuseMs: 0,
    blastRange: 2
  });
}

describe("game mode policies", () => {
  it("keeps Survival as the last-signal-standing baseline", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules("survival"));
    armElimination(state, "p1", "p2");

    tickSimulation(state, 50);

    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBe("p1");
    expect(state.players[1].respawnAtMs).toBeNull();
  });

  it("reboots a Core Rush player with a temporary phase shield", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules("core-rush"));
    armElimination(state, "p1", "p2");

    tickSimulation(state, 50);

    expect(state.phase).toBe("playing");
    expect(state.players[1].alive).toBe(false);
    expect(state.players[1].respawnAtMs).toBe(1550);
    expect(scoreForPlayer(state, "p1")).toBe(1);

    tickSimulation(state, 1500);

    expect(state.players[1].alive).toBe(true);
    expect(state.players[1].x).toBe(2);
    expect(state.players[1].y).toBe(1);
    expect(state.players[1].invulnerableUntilMs).toBe(2550);
  });

  it("ends Core Rush when one player uniquely reaches the score target", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules("core-rush"));
    const target = gameModePolicyForRules(state.rules).scoreTarget!;

    for (let score = 0; score < target; score++) {
      armElimination(state, "p1", "p2");
      tickSimulation(state, 50);
      if (score < target - 1) {
        tickSimulation(state, 1500);
        tickSimulation(state, 1000);
      }
    }

    expect(scoreForPlayer(state, "p1")).toBe(target);
    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBe("p1");
  });

  it("does not award Core Rush score for a self elimination", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], rules("core-rush"));
    const player = state.players[0];
    player.x = 1;
    player.y = 1;
    state.cores = [{ id: "self", ownerId: "p1", x: 1, y: 1, fuseMs: 0, blastRange: 1 }];

    tickSimulation(state, 50);

    expect(scoreForPlayer(state, "p1")).toBe(0);
    expect(metricsForPlayer(state, "p1")?.selfEliminations).toBe(1);
  });

  it("disables pressure-block Sudden Death in Core Rush", () => {
    expect(suddenDeathEnabledForRules(rules("core-rush"))).toBe(false);
    expect(suddenDeathEnabledForRules(rules("survival"))).toBe(true);
  });
});
