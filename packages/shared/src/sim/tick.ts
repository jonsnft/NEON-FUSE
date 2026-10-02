import type { GameState } from "./types";
import { indexOf, tileAt } from "./types";

const BLAST_TTL_MS = 260;

export function tickSimulation(state: GameState, deltaMs: number): void {
  state.elapsedMs += deltaMs;
  for (const blast of state.blasts) blast.ttlMs -= deltaMs;
  state.blasts = state.blasts.filter((blast) => blast.ttlMs > 0);

  if (state.phase !== "playing") return;

  for (const core of state.cores) core.fuseMs -= deltaMs;

  const queue = state.cores.filter((core) => core.fuseMs <= 0).map((core) => core.id);
  const exploded = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (exploded.has(id)) continue;
    const core = state.cores.find((candidate) => candidate.id === id);
    if (!core) continue;
    exploded.add(id);

    const cells = blastCells(state, core.x, core.y, core.blastRange);
    for (const [x, y] of cells) {
      if (!state.blasts.some((b) => b.x === x && b.y === y)) {
        state.blasts.push({ x, y, ttlMs: BLAST_TTL_MS });
      }

      const chained = state.cores.find((candidate) =>
        !exploded.has(candidate.id) && candidate.x === x && candidate.y === y
      );
      if (chained) queue.push(chained.id);

      for (const player of state.players) {
        if (player.alive && player.x === x && player.y === y) player.alive = false;
      }
    }
  }

  state.cores = state.cores.filter((core) => !exploded.has(core.id));
  resolveRound(state);
}

export function resolveRound(state: GameState): void {
  if (state.phase !== "playing" || state.players.length < 2) return;
  const alive = state.players.filter((player) => player.alive);
  if (alive.length <= 1) {
    state.phase = "finished";
    state.winnerId = alive[0]?.id ?? null;
  }
}

function blastCells(state: GameState, originX: number, originY: number, range: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [[originX, originY]];
  const directions = [[1,0],[-1,0],[0,1],[0,-1]] as const;

  for (const [dx, dy] of directions) {
    for (let distance = 1; distance <= range; distance++) {
      const x = originX + dx * distance;
      const y = originY + dy * distance;
      const tile = tileAt(state, x, y);
      if (tile === "hard") break;

      cells.push([x, y]);

      if (tile === "soft") {
        state.tiles[indexOf(state, x, y)] = "floor";
        const pickup = state.pickups.find((p) => p.x === x && p.y === y);
        if (pickup) pickup.revealed = true;
        break;
      }
    }
  }

  return cells;
}
