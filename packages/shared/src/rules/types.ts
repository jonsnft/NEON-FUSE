export const GAME_MODE_IDS = ["survival", "core-rush"] as const;
export type GameModeId = typeof GAME_MODE_IDS[number];

export const ITEM_PRESET_IDS = ["standard", "no-speed", "no-items"] as const;
export type ItemPresetId = typeof ITEM_PRESET_IDS[number];

export const MODIFIER_PRESET_IDS = ["standard", "no-sudden-death"] as const;
export type ModifierPresetId = typeof MODIFIER_PRESET_IDS[number];

export const PACE_PRESET_IDS = ["standard", "tactical"] as const;
export type PacePresetId = typeof PACE_PRESET_IDS[number];

export interface GameRules {
  gameModeId: GameModeId;
  itemPresetId: ItemPresetId;
  modifierPresetId: ModifierPresetId;
  pacePresetId: PacePresetId;
}

export const DEFAULT_GAME_RULES: GameRules = {
  gameModeId: "survival",
  itemPresetId: "standard",
  modifierPresetId: "standard",
  pacePresetId: "standard"
};
