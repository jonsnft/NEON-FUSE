import type { GameRules } from "../rules/types";

export type TileKind = "floor" | "hard" | "soft";
export type PickupKind = "range" | "capacity" | "speed";
export type RoundPhase = "playing" | "finished";

export interface SimPlayer {
  id: string;
  x: number;
  y: number;
  alive: boolean;
  speedTier: number;
  blastRange: number;
  coreCapacity: number;
}

export interface SimCore {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  fuseMs: number;
  blastRange: number;
}

export interface SimBlast {
  x: number;
  y: number;
  ttlMs: number;
}

export interface SimPickup {
  x: number;
  y: number;
  kind: PickupKind;
  revealed: boolean;
}

export interface PlayerMatchMetrics {
  playerId: string;
  spawnIndex: number;
  coresPlaced: number;
  pickupsCollected: Record<PickupKind, number>;
  eliminatedAtMs: number | null;
}

export interface MatchMetrics {
  chainDetonations: number;
  reachedSuddenDeath: boolean;
  players: PlayerMatchMetrics[];
}

export interface GameState {
  mapId: string;
  rules: GameRules;
  width: number;
  height: number;
  tiles: TileKind[];
  players: SimPlayer[];
  cores: SimCore[];
  blasts: SimBlast[];
  pickups: SimPickup[];
  metrics: MatchMetrics;
  elapsedMs: number;
  roundDurationMs: number;
  suddenDeathStartMs: number;
  suddenDeathCursor: number;
  nextCoreId: number;
  phase: RoundPhase;
  winnerId: string | null;
}

export const indexOf = (state: Pick<GameState, "width">, x: number, y: number) =>
  y * state.width + x;

export const tileAt = (state: GameState, x: number, y: number): TileKind =>
  state.tiles[indexOf(state, x, y)];

export const playerById = (state: GameState, playerId: string): SimPlayer | undefined =>
  state.players.find((player) => player.id === playerId);

export const metricsForPlayer = (
  state: GameState,
  playerId: string
): PlayerMatchMetrics | undefined => state.metrics.players.find((metrics) => metrics.playerId === playerId);

export const remainingRoundMs = (state: GameState): number =>
  Math.max(0, state.roundDurationMs - state.elapsedMs);

export const isSuddenDeath = (state: GameState): boolean =>
  state.phase === "playing" &&
  state.rules.modifierPresetId !== "no-sudden-death" &&
  state.elapsedMs >= state.suddenDeathStartMs;
