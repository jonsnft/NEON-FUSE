import type { PickupKind } from "../sim/types";
import type {
  GameModeId,
  GameRules,
  ItemPresetId,
  ModifierPresetId,
  PacePresetId
} from "./types";

export type ScoreSource = "none" | "eliminations" | "control";

export interface ControlModePolicy {
  nodeCount: number;
  captureMs: number;
  pointIntervalMs: number;
}

export interface GameModePolicy {
  displayName: string;
  roundDurationMs: number;
  suddenDeathAllowed: boolean;
  respawnDelayMs: number | null;
  respawnShieldMs: number;
  scoreTarget: number | null;
  scoreSource: ScoreSource;
  control: ControlModePolicy | null;
}

export const GAME_MODES: Readonly<Record<GameModeId, GameModePolicy>> = {
  survival: {
    displayName: "SURVIVAL",
    roundDurationMs: 240_000,
    suddenDeathAllowed: true,
    respawnDelayMs: null,
    respawnShieldMs: 0,
    scoreTarget: null,
    scoreSource: "none",
    control: null
  },
  "core-rush": {
    displayName: "CORE RUSH",
    roundDurationMs: 180_000,
    suddenDeathAllowed: false,
    respawnDelayMs: 1_500,
    respawnShieldMs: 1_000,
    scoreTarget: 5,
    scoreSource: "eliminations",
    control: null
  },
  "grid-control": {
    displayName: "GRID CONTROL",
    roundDurationMs: 180_000,
    suddenDeathAllowed: false,
    respawnDelayMs: 1_500,
    respawnShieldMs: 1_000,
    scoreTarget: 30,
    scoreSource: "control",
    control: {
      nodeCount: 3,
      captureMs: 1_000,
      pointIntervalMs: 1_000
    }
  }
};

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

export function gameModePolicyForRules(rules: GameRules): GameModePolicy {
  return GAME_MODES[rules.gameModeId];
}

export function pickupKindsForRules(rules: GameRules): readonly PickupKind[] {
  return ITEM_PRESETS[rules.itemPresetId];
}

export function suddenDeathEnabledForRules(rules: GameRules): boolean {
  return GAME_MODES[rules.gameModeId].suddenDeathAllowed &&
    MODIFIER_PRESETS[rules.modifierPresetId].suddenDeathEnabled;
}

export function coreFuseMsForRules(rules: GameRules): number {
  return PACE_PRESETS[rules.pacePresetId].coreFuseMs;
}
