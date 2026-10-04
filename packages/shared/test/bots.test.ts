import { describe, expect, it } from "vitest";
import {
  BOT_DIFFICULTIES,
  createOfficialArena,
  indexOf,
  placeCore,
  tickBots,
  tickSimulation,
  type BotRuntime
} from "../src";

const classicRules = {
  gameModeId: "classic-deathmatch" as const,
  itemPresetId: "standard" as const,
  modifierPresetId: "no-sudden-death" as const,
  pacePresetId: "standard" as const
};

describe("AI bots", () => {
  it("exposes four creator-selectable difficulty levels", () => {
    expect(BOT_DIFFICULTIES).toEqual(["easy", "normal", "hard", "nightmare"]);
  });

  it("drives bots through normal simulation actions", () => {
    const state = createOfficialArena("grid-zero", ["human", "bot-1"], classicRules);
    const bot = state.players.find((player) => player.id === "bot-1")!;
    const before = { x: bot.x, y: bot.y, cores: state.cores.length };
    const runtime: BotRuntime = new Map();

    const changed = tickBots(state, ["bot-1"], "normal", runtime);

    expect(changed).toBe(true);
    expect(
      bot.x !== before.x || bot.y !== before.y || state.cores.length > before.cores
    ).toBe(true);
    expect(runtime.get("bot-1")?.nextActionAtMs).toBeGreaterThan(0);
  });

  it("does not act before its difficulty reaction interval expires", () => {
    const state = createOfficialArena("grid-zero", ["human", "bot-1"], classicRules);
    const runtime: BotRuntime = new Map([["bot-1", { nextActionAtMs: 1000 }]]);
    const bot = state.players.find((player) => player.id === "bot-1")!;
    const before = { x: bot.x, y: bot.y, cores: state.cores.length };

    const changed = tickBots(state, ["bot-1"], "hard", runtime);

    expect(changed).toBe(false);
    expect({ x: bot.x, y: bot.y, cores: state.cores.length }).toEqual(before);
  });

  it("refuses to place a core when no escape route exists", () => {
    const state = createOfficialArena("grid-zero", ["human", "bot-1"], classicRules);
    const bot = state.players.find((player) => player.id === "bot-1")!;
    const human = state.players.find((player) => player.id === "human")!;
    human.x = Math.max(1, bot.x - 2);
    human.y = bot.y;

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = bot.x + dx;
      const y = bot.y + dy;
      if (x >= 0 && y >= 0 && x < state.width && y < state.height) {
        state.tiles[indexOf(state, x, y)] = "hard";
      }
    }

    const runtime: BotRuntime = new Map();
    tickBots(state, ["bot-1"], "nightmare", runtime);

    expect(state.cores.filter((core) => core.ownerId === "bot-1")).toHaveLength(0);
    expect(bot.alive).toBe(true);
  });

  it.each(BOT_DIFFICULTIES)("escapes its own blast on %s difficulty", (difficulty) => {
    const state = createOfficialArena("grid-zero", ["human", "bot-1"], classicRules);
    const bot = state.players.find((player) => player.id === "bot-1")!;
    const human = state.players.find((player) => player.id === "human")!;
    human.x = human.spawnX;
    human.y = human.spawnY;

    expect(placeCore(state, "bot-1")).toBe(true);
    const runtime: BotRuntime = new Map();

    for (let elapsed = 0; elapsed < 2100 && bot.alive; elapsed += 100) {
      tickBots(state, ["bot-1"], difficulty, runtime);
      tickSimulation(state, 100);
    }

    expect(bot.alive).toBe(true);
    expect(state.metrics.players["bot-1"]?.selfEliminations ?? 0).toBe(0);
  });
});
