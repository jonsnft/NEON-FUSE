import { describe, expect, it } from "vitest";
import { createArena, DEFAULT_GAME_RULES } from "@neon-fuse/shared";
import { finishedHudDetails, playingHudDetails } from "./matchHudDetails";

describe("match HUD gameplay details", () => {
  it("only explains pickups enabled by the selected rules", () => {
    const state = createArena(["p1", "p2"], {
      ...DEFAULT_GAME_RULES,
      itemPresetId: "no-speed"
    });
    const player = state.players[0];

    const details = playingHudDetails(state, player.id, player, 2);

    expect(details.items?.map((item) => item.name)).toEqual(["RANGE", "CORE CAP"]);
    expect(details.objective).toContain("FINAL DUEL");
  });

  it("uses authoritative match metrics for the round recap", () => {
    const state = createArena(["p1", "p2"]);
    const metrics = state.metrics.players[0];
    metrics.coresPlaced = 4;
    metrics.pickupsCollected.range = 2;
    metrics.pickupsCollected.capacity = 1;
    state.metrics.chainDetonations = 3;
    state.winnerId = "p1";

    const details = finishedHudDetails(state, "p1");

    expect(details.telemetry).toContain("YOUR CORES  4");
    expect(details.telemetry).toContain("YOUR PICKUPS  3");
    expect(details.telemetry).toContain("MATCH CHAINS  3");
    expect(details.objective).toContain("DEFEND THE RESULT");
  });
});
