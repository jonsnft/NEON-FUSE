import { gameModePolicyForRules, suddenDeathEnabledForRules } from "../rules/catalog";
import type { GameRules } from "../rules/types";

export type TileKind = "floor" | "hard" | "soft";
export type PickupKind = "range" | "capacity" | "speed";
export type RoundPhase = "playing" | "finished";
export type TeamId = "alpha" | "beta";

export interface SimPlayer {
  id: string;
  teamId: TeamId | null;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  alive: boolean;
  respawnAtMs: number | null;
  invulnerableUntilMs: number;
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
  ownerId?: string;
  sourceCoreId?: string;
}

export interface SimPickup {
  x: number;
  y: number;
  kind: PickupKind;
  revealed: boolean;
}

export interface SimControlNode {
  id: string;
  x: number;
  y: number;
  ownerId: string | null;
  capturingPlayerId: string | null;
  captureProgressMs: number;
  scoreAccumulatorMs: number;
}

export interface PlayerMatchMetrics {
  playerId: string;
  spawnIndex: number;
  coresPlaced: number;
  pickupsCollected: Record<PickupKind, number>;
  eliminations: number;
  selfEliminations: number;
  objectivePoints: number;
  nodesCaptured: number;
  eliminatedAtMs: number | null;
  eliminatedByPlayerId: string | null;
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
  controlNodes: SimControlNode[];
  metrics: MatchMetrics;
  elapsedMs: number;
  roundDurationMs: number;
  suddenDeathStartMs: number;
  suddenDeathCursor: number;
  nextCoreId: number;
  phase: RoundPhase;
  winnerId: string | null;
  winnerTeamId: TeamId | null;
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

export const scoreForPlayer = (state: GameState, playerId: string): number => {
  const metrics = metricsForPlayer(state, playerId);
  if (!metrics) return 0;
  const source = gameModePolicyForRules(state.rules).scoreSource;
  if (source === "eliminations") return metrics.eliminations;
  if (source === "control") return metrics.objectivePoints;
  return 0;
};

export const remainingRoundMs = (state: GameState): number =>
  Math.max(0, state.roundDurationMs - state.elapsedMs);

export const isSuddenDeath = (state: GameState): boolean =>
  state.phase === "playing" &&
  suddenDeathEnabledForRules(state.rules) &&
  state.elapsedMs >= state.suddenDeathStartMs;

export const isRespawnMode = (state: GameState): boolean =>
  gameModePolicyForRules(state.rules).respawnDelayMs !== null;
