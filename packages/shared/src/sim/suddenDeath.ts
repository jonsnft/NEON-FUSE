import { GAME } from "../constants/game";
import type { GameState } from "./types";
import { indexOf } from "./types";

export function suddenDeathOrder(width: number, height: number): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  let left = 1;
  let right = width - 2;
  let top = 1;
  let bottom = height - 2;

  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x++) cells.push({ x, y: top });
    for (let y = top + 1; y <= bottom; y++) cells.push({ x: right, y });

    if (bottom > top) {
      for (let x = right - 1; x >= left; x--) cells.push({ x, y: bottom });
    }
    if (right > left) {
      for (let y = bottom - 1; y > top; y--) cells.push({ x: left, y });
    }

    left++;
    right--;
    top++;
    bottom--;
  }

  return cells;
}

export function applySuddenDeath(state: GameState): void {
  if (
    state.phase !== "playing" ||
    state.rules.modifierPresetId === "no-sudden-death" ||
    state.elapsedMs < state.suddenDeathStartMs
  ) return;

  const order = suddenDeathOrder(state.width, state.height);
  const elapsed = state.elapsedMs - state.suddenDeathStartMs;
  const steps = Math.floor(elapsed / GAME.suddenDeathStepMs) + 1;
  const targetCursor = Math.min(order.length, steps * GAME.suddenDeathCellsPerStep);

  while (state.suddenDeathCursor < targetCursor) {
    const cell = order[state.suddenDeathCursor++];
    const tileIndex = indexOf(state, cell.x, cell.y);
    state.tiles[tileIndex] = "hard";

    for (const player of state.players) {
      if (player.alive && player.x === cell.x && player.y === cell.y) {
        player.alive = false;
      }
    }

    state.cores = state.cores.filter((core) => core.x !== cell.x || core.y !== cell.y);
    state.pickups = state.pickups.filter((pickup) => pickup.x !== cell.x || pickup.y !== cell.y);
    state.blasts = state.blasts.filter((blast) => blast.x !== cell.x || blast.y !== cell.y);
  }
}

export function enforceRoundDeadline(state: GameState): void {
  if (state.phase !== "playing" || state.elapsedMs < state.roundDurationMs) return;
  const alive = state.players.filter((player) => player.alive);
  state.phase = "finished";
  state.winnerId = alive.length === 1 ? alive[0].id : null;
}
