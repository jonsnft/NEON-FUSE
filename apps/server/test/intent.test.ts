import { describe, expect, it } from "vitest";
import {
  PROTOCOL_VERSION,
  createArena,
  playerById,
  type ClientIntent
} from "@neon-fuse/shared";
import { applyClientIntent } from "../src/intent";

describe("authoritative intent application", () => {
  it("accepts a new movement sequence once", () => {
    const game = createArena(["p1", "p2"]);
    const seq = new Map<string, number>();
    const intent: ClientIntent = {
      type: "player.move",
      version: PROTOCOL_VERSION,
      seq: 1,
      direction: "right"
    };

    expect(applyClientIntent(game, "p1", intent, seq)).toBe(true);
    expect(playerById(game, "p1")?.x).toBe(2);
    expect(applyClientIntent(game, "p1", intent, seq)).toBe(false);
  });

  it("rejects stale input sequence numbers", () => {
    const game = createArena(["p1", "p2"]);
    const seq = new Map<string, number>([["p1", 10]]);
    const stale: ClientIntent = {
      type: "core.place",
      version: PROTOCOL_VERSION,
      seq: 9
    };

    expect(applyClientIntent(game, "p1", stale, seq)).toBe(false);
    expect(game.cores).toHaveLength(0);
  });
});
