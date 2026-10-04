import type { PickupKind } from "../sim/types";
import type {
  GameModeId,
  GameRules,
  ItemPresetId,
  ModifierPresetId,
  PacePresetId
} from "./types";

export type ScoreSource = "none" | "eliminations" | "control";
export type TeamPolicy = "free-for-all" | "two-teams";

export interface ControlModePolicy {
  nodeCount: number;
  captureMs: number;
  pointIntervalMs: number;
}

export interface GameModePolicy {
  displayName: string;
  category: "classic" | "cyberphunks";
  description: string;
  objective: string;
  teamPolicy: TeamPolicy;
  roundDurationMs: number;
  suddenDeathAllowed: boolean;
  respawnDelayMs: number | null;
  respawnShieldMs: number;
  scoreTarget: number | null;
  scoreSource: ScoreSource;
  control: ControlModePolicy | null;
}

export const GAME_MODES: Readonly<Record<GameModeId, GameModePolicy>> = {
  "classic-deathmatch": {
    displayName: "CLASSIC DEATHMATCH",
    category: "classic",
    description: "Free-for-all Bomberman rules. No respawns. Last player standing wins.",
    objective: "LAST PLAYER STANDING",
    teamPolicy: "free-for-all",
    roundDurationMs: 240_000,
    suddenDeathAllowed: true,
    respawnDelayMs: null,
    respawnShieldMs: 0,
    scoreTarget: null,
    scoreSource: "none",
    control: null
  },
  "classic-team-deathmatch": {
    displayName: "CLASSIC TEAM DEATHMATCH",
    category: "classic",
    description: "Two teams, classic bomb rules, no respawns. Eliminate the opposing team.",
    objective: "LAST TEAM STANDING",
    teamPolicy: "two-teams",
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
    category: "cyberphunks",
    description: "Respawn arena. Score eliminations and race to the target before time expires.",
    objective: "REACH THE ELIMINATION TARGET",
    teamPolicy: "free-for-all",
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
    category: "cyberphunks",
    description: "Capture live grid nodes, hold territory and build sync score while the arena stays active.",
    objective: "CONTROL THE GRID",
    teamPolicy: "free-for-all",
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
