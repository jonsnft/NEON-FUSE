export const ITEM_PRESET_IDS = ["standard", "no-speed", "no-items"] as const;
export type ItemPresetId = typeof ITEM_PRESET_IDS[number];

export const MODIFIER_PRESET_IDS = ["standard", "no-sudden-death"] as const;
export type ModifierPresetId = typeof MODIFIER_PRESET_IDS[number];

export interface GameRules {
  itemPresetId: ItemPresetId;
  modifierPresetId: ModifierPresetId;
}

export const DEFAULT_GAME_RULES: GameRules = {
  itemPresetId: "standard",
  modifierPresetId: "standard"
};
