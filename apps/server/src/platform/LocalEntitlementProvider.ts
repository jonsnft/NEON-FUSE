import {
  ALTERNATE_STARTER_LOADOUT,
  DEFAULT_LOADOUT,
  type PlayerPresentation
} from "@neon-fuse/shared";
import type { EntitlementProvider } from "./EntitlementProvider";

export class LocalEntitlementProvider implements EntitlementProvider {
  async getPresentation(_subjectId: string, rosterIndex: number): Promise<PlayerPresentation> {
    return {
      loadout: rosterIndex % 2 === 0
        ? { ...DEFAULT_LOADOUT }
        : { ...ALTERNATE_STARTER_LOADOUT }
    };
  }
}
