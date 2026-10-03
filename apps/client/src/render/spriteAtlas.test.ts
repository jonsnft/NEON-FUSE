import { describe, expect, it } from "vitest";
import { coreFrame, pickupFrame, playerFrame, tileFrame } from "./spriteAtlas";

describe("sprite atlas frame mapping", () => {
  it("maps official map materials", () => {
    expect(tileFrame("grid-zero", "hard")).toBe("tile-grid-hard");
    expect(tileFrame("data-cross", "soft")).toBe("tile-data-soft");
    expect(tileFrame("switchyard", "floor")).toBe("tile-switch-floor");
  });

  it("maps player facing and locomotion", () => {
    expect(playerFrame("left", false)).toBe("player-left-idle");
    expect(playerFrame("right", true)).toBe("player-right-move");
  });

  it("keeps reduced-motion core progression readable", () => {
    expect(coreFrame(0, 0, false)).toBe("core-0");
    expect(coreFrame(0.5, 0, false)).toBe("core-2");
    expect(coreFrame(1, 0, false)).toBe("core-3");
  });

  it("freezes pickup animation when motion is disabled", () => {
    expect(pickupFrame("speed", 500, false)).toBe("pickup-speed-0");
    expect(pickupFrame("speed", 500, true)).toBe("pickup-speed-0");
    expect(pickupFrame("speed", 660, true)).toBe("pickup-speed-1");
  });
});
