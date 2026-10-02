import { describe, expect, it } from "vitest";
import { validateLoadout } from "@neon-fuse/shared";
import { LocalEntitlementProvider } from "../src/platform/LocalEntitlementProvider";

describe("local entitlement adapter", () => {
  it("returns only valid presentation loadouts", async () => {
    const provider = new LocalEntitlementProvider();
    const first = await provider.getPresentation("p1", 0);
    const second = await provider.getPresentation("p2", 1);

    expect(validateLoadout(first.loadout)).toBe(true);
    expect(validateLoadout(second.loadout)).toBe(true);
    expect(first.loadout.avatar).not.toBe(second.loadout.avatar);
  });
});
