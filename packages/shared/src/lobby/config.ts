import { OFFICIAL_MAP_IDS, type OfficialMapId } from "../maps/official";
import {
  DEFAULT_GAME_RULES,
  GAME_MODE_IDS,
  ITEM_PRESET_IDS,
  MODIFIER_PRESET_IDS,
  PACE_PRESET_IDS,
  type GameModeId,
  type GameRules,
  type ItemPresetId,
  type ModifierPresetId,
  type PacePresetId
} from "../rules/types";

export const MIN_LOBBY_PLAYERS = 2;
export const MAX_LOBBY_PLAYERS = 8;

export interface LobbyConfig extends GameRules {
  maxPlayers: number;
  mapId: OfficialMapId;
}

export type LobbyConfigPatch = Partial<LobbyConfig>;

export const DEFAULT_LOBBY_CONFIG: LobbyConfig = {
  maxPlayers: MAX_LOBBY_PLAYERS,
  mapId: "grid-zero",
  ...DEFAULT_GAME_RULES
};

export interface LobbyConfigureRequest {
  type: "lobby.configure";
  version: 1;
  patch: LobbyConfigPatch;
}

export function isLobbyConfigureRequest(value: unknown): value is LobbyConfigureRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.type !== "lobby.configure" || candidate.version !== 1) return false;
  if (!candidate.patch || typeof candidate.patch !== "object" || Array.isArray(candidate.patch)) return false;

  const patch = candidate.patch as Record<string, unknown>;
  const allowed = new Set(["maxPlayers", "mapId", "gameModeId", "itemPresetId", "modifierPresetId", "pacePresetId"]);
  if (Object.keys(patch).some((key) => !allowed.has(key))) return false;

  if ("maxPlayers" in patch && !Number.isInteger(patch.maxPlayers)) return false;
  if ("mapId" in patch && !(OFFICIAL_MAP_IDS as readonly unknown[]).includes(patch.mapId)) return false;
  if ("gameModeId" in patch && !(GAME_MODE_IDS as readonly unknown[]).includes(patch.gameModeId)) return false;
  if ("itemPresetId" in patch && !(ITEM_PRESET_IDS as readonly unknown[]).includes(patch.itemPresetId)) return false;
  if ("modifierPresetId" in patch && !(MODIFIER_PRESET_IDS as readonly unknown[]).includes(patch.modifierPresetId)) return false;
  if ("pacePresetId" in patch && !(PACE_PRESET_IDS as readonly unknown[]).includes(patch.pacePresetId)) return false;
  return Object.keys(patch).length > 0;
}

export function applyLobbyConfigPatch(
  current: LobbyConfig,
  patch: LobbyConfigPatch,
  connectedPlayers: number
): LobbyConfig | null {
  const next: LobbyConfig = { ...current, ...patch };
  if (!Number.isInteger(next.maxPlayers)) return null;
  if (next.maxPlayers < MIN_LOBBY_PLAYERS || next.maxPlayers > MAX_LOBBY_PLAYERS) return null;
  if (next.maxPlayers < connectedPlayers) return null;
  if (!(OFFICIAL_MAP_IDS as readonly string[]).includes(next.mapId)) return null;
  if (!(GAME_MODE_IDS as readonly string[]).includes(next.gameModeId as GameModeId)) return null;
  if (!(ITEM_PRESET_IDS as readonly string[]).includes(next.itemPresetId as ItemPresetId)) return null;
  if (!(MODIFIER_PRESET_IDS as readonly string[]).includes(next.modifierPresetId as ModifierPresetId)) return null;
  if (!(PACE_PRESET_IDS as readonly string[]).includes(next.pacePresetId as PacePresetId)) return null;
  return next;
}
