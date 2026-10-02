import {
  validateCreatorCosmetic,
  validateCreatorMap,
  type CreatorCosmeticSubmission,
  type CreatorMapDefinition,
  type ModeratedCreatorCosmetic,
  type ModeratedCreatorMap,
  type ModerationState
} from "@neon-fuse/shared";
import type { CreatorContentRepository } from "./CreatorContentRepository";

export class LocalCreatorContentRepository implements CreatorContentRepository {
  private readonly maps = new Map<string, ModeratedCreatorMap>();
  private readonly cosmetics = new Map<string, ModeratedCreatorCosmetic>();

  async submitMap(input: CreatorMapDefinition): Promise<ModeratedCreatorMap> {
    const result = validateCreatorMap(input);
    if (!result.ok || !result.value) throw new Error(result.errors.join("; "));
    if (this.maps.has(result.value.id)) throw new Error("map id already exists");

    const record: ModeratedCreatorMap = {
      content: result.value,
      moderationState: "pending"
    };
    this.maps.set(record.content.id, record);
    return structuredClone(record);
  }

  async submitCosmetic(input: CreatorCosmeticSubmission): Promise<ModeratedCreatorCosmetic> {
    const result = validateCreatorCosmetic(input);
    if (!result.ok || !result.value) throw new Error(result.errors.join("; "));
    if (this.cosmetics.has(result.value.id)) throw new Error("cosmetic id already exists");

    const record: ModeratedCreatorCosmetic = {
      content: result.value,
      moderationState: "pending"
    };
    this.cosmetics.set(record.content.id, record);
    return structuredClone(record);
  }

  async moderateMap(
    id: string,
    state: Exclude<ModerationState, "draft">,
    note?: string
  ): Promise<void> {
    const record = this.maps.get(id);
    if (!record) throw new Error("unknown map");
    record.moderationState = state;
    record.moderationNote = note;
  }

  async moderateCosmetic(
    id: string,
    state: Exclude<ModerationState, "draft">,
    note?: string
  ): Promise<void> {
    const record = this.cosmetics.get(id);
    if (!record) throw new Error("unknown cosmetic");
    record.moderationState = state;
    record.moderationNote = note;
  }

  async listApprovedMaps(): Promise<CreatorMapDefinition[]> {
    return [...this.maps.values()]
      .filter((record) => record.moderationState === "approved")
      .map((record) => structuredClone(record.content));
  }

  async listApprovedCosmetics(): Promise<CreatorCosmeticSubmission[]> {
    return [...this.cosmetics.values()]
      .filter((record) => record.moderationState === "approved")
      .map((record) => structuredClone(record.content));
  }
}
