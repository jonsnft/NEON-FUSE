import { describe, expect, it } from "vitest";
import { validateLoadout } from "@neon-fuse/shared";
import { LocalEntitlementProvider } from "../src/platform/LocalEntitlementProvider";

describe("local entitlement adapter", () => {
  it("returns a valid loadout plus owned item ids", async () => {
    const provider = new LocalEntitlementProvider();
    const first = await provider.getEntitlements("p1", 0);
    const second = await provider.getEntitlements("p2", 1);

    expect(validateLoadout(first.presentation.loadout)).toBe(true);
    expect(validateLoadout(second.presentation.loadout)).toBe(true);
    expect(first.presentation.loadout.avatar).not.toBe(second.presentation.loadout.avatar);
    expect(first.ownedItemIds).toContain(first.presentation.loadout.avatar);
    expect(first.ownedItemIds).toContain(first.presentation.loadout.core);
    expect(first.ownedItemIds).toContain(first.presentation.loadout.blast);
  });
});
