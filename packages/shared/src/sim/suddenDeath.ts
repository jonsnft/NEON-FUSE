import { GAME } from "../constants/game";
import { gameModePolicyForRules, suddenDeathEnabledForRules } from "../rules/catalog";
import type { GameState } from "./types";
import { indexOf, scoreForPlayer } from "./types";

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
    !suddenDeathEnabledForRules(state.rules) ||
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
        player.respawnAtMs = null;
      }
    }

    state.cores = state.cores.filter((core) => core.x !== cell.x || core.y !== cell.y);
    state.pickups = state.pickups.filter((pickup) => pickup.x !== cell.x || pickup.y !== cell.y);
    state.blasts = state.blasts.filter((blast) => blast.x !== cell.x || blast.y !== cell.y);
  }
}

export function enforceRoundDeadline(state: GameState): void {
  if (state.phase !== "playing" || state.elapsedMs < state.roundDurationMs) return;
  const mode = gameModePolicyForRules(state.rules);

  state.phase = "finished";
  if (mode.scoreTarget !== null) {
    const scores = state.players.map((player) => ({ id: player.id, score: scoreForPlayer(state, player.id) }));
    const best = Math.max(...scores.map(({ score }) => score));
    const leaders = scores.filter(({ score }) => score === best);
    state.winnerId = leaders.length === 1 ? leaders[0].id : null;
    state.winnerTeamId = null;
    return;
  }

  if (mode.teamPolicy === "two-teams") {
    const aliveByTeam = new Map<string, number>();
    for (const player of state.players) {
      if (!player.alive || !player.teamId) continue;
      aliveByTeam.set(player.teamId, (aliveByTeam.get(player.teamId) ?? 0) + 1);
    }
    const best = Math.max(0, ...aliveByTeam.values());
    const leaders = [...aliveByTeam.entries()].filter(([, count]) => count === best);
    state.winnerId = null;
    state.winnerTeamId = leaders.length === 1 ? leaders[0][0] as "alpha" | "beta" : null;
    return;
  }

  const alive = state.players.filter((player) => player.alive);
  state.winnerId = alive.length === 1 ? alive[0].id : null;
  state.winnerTeamId = null;
}
