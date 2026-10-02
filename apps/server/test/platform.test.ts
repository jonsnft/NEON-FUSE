import { describe, expect, it } from "vitest";
import { createPlatformServices } from "../src/platform/createPlatformServices";

describe("platform service boundary", () => {
  it("resolves local identity and entitlements without external services", async () => {
    const platform = createPlatformServices("local");
    const subject = await platform.identity.resolveSubject("session-1");
    const entitlements = await platform.entitlements.getEntitlements(subject.subjectId, 0);

    expect(subject.subjectId).toBe("session-1");
    expect(entitlements.ownedItemIds.length).toBeGreaterThan(0);
  });

  it("fails closed when PlayBay mode has no verified contract", () => {
    expect(() => createPlatformServices("playbay")).toThrow(/verified public integration contract/i);
  });
});
