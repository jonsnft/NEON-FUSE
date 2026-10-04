import type { Direction } from "../types/game";
import { movePlayer, placeCore } from "../sim/actions";
import type { GameState, SimPlayer } from "../sim/types";
import { playerById, tileAt } from "../sim/types";

export const BOT_DIFFICULTIES = ["easy", "normal", "hard", "nightmare"] as const;
export type BotDifficulty = typeof BOT_DIFFICULTIES[number];

export interface BotRuntimeState {
  nextActionAtMs: number;
}

export type BotRuntime = Map<string, BotRuntimeState>;

const DIRECTIONS: readonly Direction[] = ["up", "right", "down", "left"];
const DELTA: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0]
};

const PROFILE: Record<BotDifficulty, { actionMs: number; dangerLookaheadMs: number; aggression: number }> = {
  easy: { actionMs: 460, dangerLookaheadMs: 450, aggression: 0.18 },
  normal: { actionMs: 300, dangerLookaheadMs: 900, aggression: 0.34 },
  hard: { actionMs: 190, dangerLookaheadMs: 1400, aggression: 0.52 },
  nightmare: { actionMs: 120, dangerLookaheadMs: 1800, aggression: 0.7 }
};

const hash = (value: string): number => {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const blastThreatens = (state: GameState, x: number, y: number, lookaheadMs: number): boolean => {
  if (state.blasts.some((blast) => blast.x === x && blast.y === y)) return true;

  for (const core of state.cores) {
    if (core.fuseMs > lookaheadMs) continue;
    if (core.x === x && core.y === y) return true;
    if (core.x !== x && core.y !== y) continue;

    const dx = Math.sign(x - core.x);
    const dy = Math.sign(y - core.y);
    const distance = Math.abs(x - core.x) + Math.abs(y - core.y);
    if (distance > core.blastRange) continue;

    let blocked = false;
    for (let step = 1; step <= distance; step++) {
      const tx = core.x + dx * step;
      const ty = core.y + dy * step;
      const tile = tileAt(state, tx, ty);
      if (tile === "hard") {
        blocked = true;
        break;
      }
      if (tile === "soft" && step < distance) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return true;
  }
  return false;
};

const canEnter = (state: GameState, player: SimPlayer, direction: Direction): boolean => {
  const [dx, dy] = DELTA[direction];
  const x = player.x + dx;
  const y = player.y + dy;
  if (tileAt(state, x, y) !== "floor") return false;
  if (state.cores.some((core) => core.x === x && core.y === y)) return false;
  return !state.players.some((other) => other.alive && other.id !== player.id && other.x === x && other.y === y);
};

const nearestEnemyDistance = (state: GameState, player: SimPlayer, x = player.x, y = player.y): number => {
  const enemies = state.players.filter((other) =>
    other.alive &&
    other.id !== player.id &&
    (!player.teamId || !other.teamId || other.teamId !== player.teamId)
  );
  if (enemies.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...enemies.map((enemy) => Math.abs(enemy.x - x) + Math.abs(enemy.y - y)));
};

const adjacentSoftCount = (state: GameState, player: SimPlayer): number =>
  DIRECTIONS.reduce((count, direction) => {
    const [dx, dy] = DELTA[direction];
    return count + (tileAt(state, player.x + dx, player.y + dy) === "soft" ? 1 : 0);
  }, 0);

function chooseMove(state: GameState, player: SimPlayer, difficulty: BotDifficulty): Direction | null {
  const profile = PROFILE[difficulty];
  const seed = hash(`${player.id}:${Math.floor(state.elapsedMs / profile.actionMs)}`);

  const options = DIRECTIONS
    .filter((direction) => canEnter(state, player, direction))
    .map((direction, index) => {
      const [dx, dy] = DELTA[direction];
      const x = player.x + dx;
      const y = player.y + dy;
      const danger = blastThreatens(state, x, y, profile.dangerLookaheadMs);
      const enemyDistance = nearestEnemyDistance(state, player, x, y);
      const pickup = state.pickups.some((item) => item.revealed && item.x === x && item.y === y);
      const jitter = ((seed + index * 17) % 23) / 100;
      const score = (danger ? -100 : 0) + (pickup ? 6 : 0) - enemyDistance * profile.aggression + jitter;
      return { direction, score };
    })
    .sort((a, b) => b.score - a.score);

  return options[0]?.direction ?? null;
}

function shouldPlaceCore(state: GameState, player: SimPlayer, difficulty: BotDifficulty): boolean {
  const profile = PROFILE[difficulty];
  if (blastThreatens(state, player.x, player.y, profile.dangerLookaheadMs)) return false;
  if (state.cores.filter((core) => core.ownerId === player.id).length >= player.coreCapacity) return false;
  if (state.cores.some((core) => core.x === player.x && core.y === player.y)) return false;

  const enemyDistance = nearestEnemyDistance(state, player);
  const soft = adjacentSoftCount(state, player);
  const seed = hash(`${player.id}:core:${Math.floor(state.elapsedMs / profile.actionMs)}`) % 100;
  const threshold = Math.round(profile.aggression * 100);
  return enemyDistance <= 3 || soft > 0 && seed < threshold;
}

export function tickBots(
  state: GameState,
  botIds: readonly string[],
  difficulty: BotDifficulty,
  runtime: BotRuntime
): boolean {
  if (state.phase !== "playing") return false;
  const profile = PROFILE[difficulty];
  let changed = false;

  for (const botId of botIds) {
    const player = playerById(state, botId);
    if (!player?.alive) continue;

    const memory = runtime.get(botId) ?? { nextActionAtMs: 0 };
    if (state.elapsedMs < memory.nextActionAtMs) continue;
    memory.nextActionAtMs = state.elapsedMs + profile.actionMs;
    runtime.set(botId, memory);

    if (shouldPlaceCore(state, player, difficulty)) {
      changed = placeCore(state, botId) || changed;
    }

    const direction = chooseMove(state, player, difficulty);
    if (direction) changed = movePlayer(state, botId, direction) || changed;
  }

  return changed;
}
