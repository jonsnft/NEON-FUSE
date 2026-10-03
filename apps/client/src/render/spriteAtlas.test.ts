import { describe, expect, it } from "vitest";
import {
  coreFrame,
  corePlacementFrame,
  eliminationFrame,
  pickupFrame,
  playerFrame,
  tileFrame
} from "./spriteAtlas";

describe("sprite sheet frame mapping", () => {
  it("maps official map materials", () => {
    expect(tileFrame("grid-zero", "hard")).toBe(1);
    expect(tileFrame("data-cross", "soft")).toBe(5);
    expect(tileFrame("switchyard", "floor")).toBe(6);
  });

  it("maps avatar variants, facing, idle and four-frame walk cycles", () => {
    expect(playerFrame("cyan", "down", false, 0, true)).toBe(9);
    expect(playerFrame("cyan", "down", false, 650, true)).toBe(10);
    expect(playerFrame("lime", "left", true, 0, true)).toBe(47);
    expect(playerFrame("lime", "left", true, 270, true)).toBe(50);
    expect(playerFrame("ghost", "right", false, 0, false)).toBe(75);
  });

  it("freezes locomotion animation when motion is disabled", () => {
    expect(playerFrame("cyan", "right", true, 900, false)).toBe(27);
  });

  it("maps elimination frames with a reduced-motion fallback", () => {
    expect(eliminationFrame("cyan", 0, true)).toBe(81);
    expect(eliminationFrame("cyan", 390, true)).toBe(84);
    expect(eliminationFrame("ghost", 0, false)).toBe(91);
  });

  it("maps core placement and fuse urgency", () => {
    expect(corePlacementFrame(0)).toBe(93);
    expect(corePlacementFrame(160)).toBe(95);
    expect(coreFrame(0, 0, false)).toBe(96);
    expect(coreFrame(0.5, 0, false)).toBe(98);
    expect(coreFrame(1, 0, false)).toBe(99);
  });

  it("freezes pickup animation when motion is disabled", () => {
    expect(pickupFrame("speed", 500, false)).toBe(104);
    expect(pickupFrame("speed", 500, true)).toBe(104);
    expect(pickupFrame("speed", 660, true)).toBe(105);
  });
});
