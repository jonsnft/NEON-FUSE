import { describe, expect, it } from "vitest";
import { PROTOCOL_VERSION, isClientIntent } from "../src";

describe("network protocol validation", () => {
  it("accepts ready and rematch lifecycle intents", () => {
    expect(isClientIntent({
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    })).toBe(true);

    expect(isClientIntent({
      type: "match.rematch",
      version: PROTOCOL_VERSION
    })).toBe(true);
  });

  it("rejects malformed lifecycle and gameplay intents", () => {
    expect(isClientIntent({
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: "yes"
    })).toBe(false);

    expect(isClientIntent({
      type: "player.move",
      version: PROTOCOL_VERSION,
      seq: 1,
      direction: "teleport"
    })).toBe(false);

    expect(isClientIntent({
      type: "core.place",
      version: 999,
      seq: 1
    })).toBe(false);
  });
});
