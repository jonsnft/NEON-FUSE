import type { Direction } from "../types/game";
import type { GameState } from "./types";
import { tileAt } from "./types";

const delta: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0]
};

export function movePlayer(state: GameState, direction: Direction): boolean {
  if (!state.player.alive) return false;
  const [dx, dy] = delta[direction];
  const x = state.player.x + dx;
  const y = state.player.y + dy;

  if (tileAt(state, x, y) !== "floor") return false;
  if (state.cores.some((core) => core.x === x && core.y === y)) return false;

  state.player.x = x;
  state.player.y = y;

  const pickup = state.pickups.find((p) => p.revealed && p.x === x && p.y === y);
  if (pickup) {
    if (pickup.kind === "range") state.player.blastRange++;
    if (pickup.kind === "capacity") state.player.coreCapacity++;
    if (pickup.kind === "speed") state.player.speedTier++;
    state.pickups = state.pickups.filter((p) => p !== pickup);
  }

  return true;
}

export function placeCore(state: GameState, fuseMs = 1800): boolean {
  if (!state.player.alive) return false;
  const owned = state.cores.filter((core) => core.ownerId === state.player.id).length;
  if (owned >= state.player.coreCapacity) return false;
  if (state.cores.some((core) => core.x === state.player.x && core.y === state.player.y)) return false;

  state.cores.push({
    id: `core-${state.nextCoreId++}`,
    ownerId: state.player.id,
    x: state.player.x,
    y: state.player.y,
    fuseMs
  });
  return true;
}
