import type { PickupKind } from "../sim/types";
import type {
  GameRules,
  ItemPresetId,
  ModifierPresetId,
  PacePresetId
} from "./types";

export const ITEM_PRESETS: Readonly<Record<ItemPresetId, readonly PickupKind[]>> = {
  standard: ["range", "capacity", "speed"],
  "no-speed": ["range", "capacity"],
  "no-items": []
};

export const MODIFIER_PRESETS: Readonly<
  Record<ModifierPresetId, { suddenDeathEnabled: boolean }>
> = {
  standard: { suddenDeathEnabled: true },
  "no-sudden-death": { suddenDeathEnabled: false }
};

export const PACE_PRESETS: Readonly<
  Record<PacePresetId, { coreFuseMs: number }>
> = {
  standard: { coreFuseMs: 1800 },
  tactical: { coreFuseMs: 2400 }
};

export function pickupKindsForRules(rules: GameRules): readonly PickupKind[] {
  return ITEM_PRESETS[rules.itemPresetId];
}

export function suddenDeathEnabledForRules(rules: GameRules): boolean {
  return MODIFIER_PRESETS[rules.modifierPresetId].suddenDeathEnabled;
}

export function coreFuseMsForRules(rules: GameRules): number {
  return PACE_PRESETS[rules.pacePresetId].coreFuseMs;
}
