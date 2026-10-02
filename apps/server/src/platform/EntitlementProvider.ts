import type { PlayerPresentation } from "@neon-fuse/shared";

export interface PlayerEntitlements {
  ownedItemIds: string[];
  presentation: PlayerPresentation;
}

export interface EntitlementProvider {
  getEntitlements(subjectId: string, rosterIndex: number): Promise<PlayerEntitlements>;
}
