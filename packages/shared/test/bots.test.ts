import { describe, expect, it } from "vitest";
import {
  BOT_DIFFICULTIES,
  createOfficialArena,
  tickBots,
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
});
