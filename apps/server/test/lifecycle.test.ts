import { describe, expect, it } from "vitest";
import {
  HARD_MAX_PLAYERS,
  MIN_PLAYERS,
  clampMaxPlayers,
  everyConnectedHasVoted,
  idsExcluding
} from "../src/lifecycle";

describe("match lifecycle helpers", () => {
  it("clamps room capacity to the 2-8 architecture range", () => {
    expect(clampMaxPlayers(1)).toBe(MIN_PLAYERS);
    expect(clampMaxPlayers(4)).toBe(4);
    expect(clampMaxPlayers(99)).toBe(HARD_MAX_PLAYERS);
    expect(clampMaxPlayers("bad")).toBe(HARD_MAX_PLAYERS);
  });

  it("requires every connected player and at least two votes", () => {
    expect(everyConnectedHasVoted(["a"], new Set(["a"]))).toBe(false);
    expect(everyConnectedHasVoted(["a", "b"], new Set(["a"]))).toBe(false);
    expect(everyConnectedHasVoted(["a", "b"], new Set(["a", "b"]))).toBe(true);
  });

  it("computes a stable remaining roster regardless of leave callback timing", () => {
    expect(idsExcluding(["a", "b", "c"], "b")).toEqual(["a", "c"]);
    expect(idsExcluding(["a", "c"], "b")).toEqual(["a", "c"]);
  });
});
