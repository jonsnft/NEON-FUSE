import type {
  CreatorCosmeticSubmission,
  CreatorMapDefinition,
  ModeratedCreatorCosmetic,
  ModeratedCreatorMap,
  ModerationState
} from "@neon-fuse/shared";

export interface CreatorContentRepository {
  submitMap(map: CreatorMapDefinition): Promise<ModeratedCreatorMap>;
  submitCosmetic(cosmetic: CreatorCosmeticSubmission): Promise<ModeratedCreatorCosmetic>;
  moderateMap(id: string, state: Exclude<ModerationState, "draft">, note?: string): Promise<void>;
  moderateCosmetic(id: string, state: Exclude<ModerationState, "draft">, note?: string): Promise<void>;
  listApprovedMaps(): Promise<CreatorMapDefinition[]>;
  listApprovedCosmetics(): Promise<CreatorCosmeticSubmission[]>;
}
