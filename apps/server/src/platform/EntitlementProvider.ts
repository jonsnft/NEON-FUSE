import type { PlayerPresentation } from "@neon-fuse/shared";

export interface EntitlementProvider {
  getPresentation(subjectId: string, rosterIndex: number): Promise<PlayerPresentation>;
}
