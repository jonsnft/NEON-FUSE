import type { Direction } from "../types/game";
import { coreFuseMsForRules } from "../rules/catalog";
import type { GameState } from "./types";
import { metricsForPlayer, playerById, tileAt } from "./types";

const delta: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0]
};

export function movePlayer(state: GameState, playerId: string, direction: Direction): boolean {
  if (state.phase !== "playing") return false;
  const player = playerById(state, playerId);
  if (!player?.alive) return false;

  const [dx, dy] = delta[direction];
  const x = player.x + dx;
  const y = player.y + dy;

  if (tileAt(state, x, y) !== "floor") return false;
  if (state.cores.some((core) => core.x === x && core.y === y)) return false;
  if (state.players.some((other) => other.alive && other.id !== playerId && other.x === x && other.y === y)) return false;

  player.x = x;
  player.y = y;

  const pickup = state.pickups.find((p) => p.revealed && p.x === x && p.y === y);
  if (pickup) {
    if (pickup.kind === "range") player.blastRange++;
    if (pickup.kind === "capacity") player.coreCapacity++;
    if (pickup.kind === "speed") player.speedTier++;
    const metrics = metricsForPlayer(state, playerId);
    if (metrics) metrics.pickupsCollected[pickup.kind]++;
    state.pickups = state.pickups.filter((p) => p !== pickup);
  }

  return true;
}

export function placeCore(
  state: GameState,
  playerId: string,
  fuseMs = coreFuseMsForRules(state.rules)
): boolean {
  if (state.phase !== "playing") return false;
  const player = playerById(state, playerId);
  if (!player?.alive) return false;

  const owned = state.cores.filter((core) => core.ownerId === player.id).length;
  if (owned >= player.coreCapacity) return false;
  if (state.cores.some((core) => core.x === player.x && core.y === player.y)) return false;

  state.cores.push({
    id: `core-${state.nextCoreId++}`,
    ownerId: player.id,
    x: player.x,
    y: player.y,
    fuseMs,
    blastRange: player.blastRange
  });
  const metrics = metricsForPlayer(state, playerId);
  if (metrics) metrics.coresPlaced++;
  return true;
}
