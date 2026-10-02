import type { CosmeticCategory, CosmeticItem } from "../cosmetics/types";
import type { GridPosition } from "../types/game";
import type { TileKind } from "../sim/types";

export type ModerationState = "draft" | "pending" | "approved" | "rejected";

export interface CreatorMapDefinition {
  id: string;
  version: 1;
  displayName: string;
  creatorId: string;
  width: number;
  height: number;
  tiles: TileKind[];
  spawnPoints: GridPosition[];
}

export interface CreatorCosmeticSubmission {
  id: string;
  displayName: string;
  description: string;
  creatorId: string;
  category: CosmeticCategory;
  visualToken: string;
  requestedPriceShells: number;
}

export interface ModeratedCreatorMap {
  content: CreatorMapDefinition;
  moderationState: ModerationState;
  moderationNote?: string;
}

export interface ModeratedCreatorCosmetic {
  content: CreatorCosmeticSubmission;
  moderationState: ModerationState;
  moderationNote?: string;
}

export interface ApprovedCreatorCosmetic {
  submission: CreatorCosmeticSubmission;
  item: CosmeticItem;
}
