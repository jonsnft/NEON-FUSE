import {
  ALTERNATE_STARTER_LOADOUT,
  DEFAULT_LOADOUT,
  type PlayerPresentation
} from "@neon-fuse/shared";
import type { EntitlementProvider, PlayerEntitlements } from "./EntitlementProvider";

const ownedIds = (presentation: PlayerPresentation): string[] =>
  Object.values(presentation.loadout).filter((id): id is string => Boolean(id));

export class LocalEntitlementProvider implements EntitlementProvider {
  async getEntitlements(_subjectId: string, rosterIndex: number): Promise<PlayerEntitlements> {
    const presentation: PlayerPresentation = {
      loadout: rosterIndex % 2 === 0
        ? { ...DEFAULT_LOADOUT }
        : { ...ALTERNATE_STARTER_LOADOUT }
    };

    return {
      ownedItemIds: ownedIds(presentation),
      presentation
    };
  }
}
