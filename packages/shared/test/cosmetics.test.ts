import { describe, expect, it } from "vitest";
import {
  COSMETIC_CATALOG,
  DEFAULT_LOADOUT,
  validateLoadout
} from "../src";

describe("cosmetic catalog invariants", () => {
  it("contains only non-gameplay items", () => {
    expect(COSMETIC_CATALOG.length).toBeGreaterThan(0);
    for (const item of COSMETIC_CATALOG) {
      expect(item.gameplayEffect).toBe("none");
      if (item.price) {
        expect(item.price.unit).toBe("shells");
        expect(Number.isInteger(item.price.amount)).toBe(true);
        expect(item.price.amount).toBeGreaterThan(0);
      }
    }
  });

  it("accepts the default loadout and rejects category mismatches", () => {
    expect(validateLoadout(DEFAULT_LOADOUT)).toBe(true);
    expect(validateLoadout({
      ...DEFAULT_LOADOUT,
      avatar: "core.plasma"
    })).toBe(false);
  });
});
