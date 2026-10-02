import type { GameState } from "./types";
import { indexOf, tileAt } from "./types";

const BLAST_TTL_MS = 260;

export function tickSimulation(state: GameState, deltaMs: number): void {
  state.elapsedMs += deltaMs;
  for (const blast of state.blasts) blast.ttlMs -= deltaMs;
  state.blasts = state.blasts.filter((blast) => blast.ttlMs > 0);

  for (const core of state.cores) core.fuseMs -= deltaMs;

  const queue = state.cores.filter((core) => core.fuseMs <= 0).map((core) => core.id);
  const exploded = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (exploded.has(id)) continue;
    const core = state.cores.find((candidate) => candidate.id === id);
    if (!core) continue;
    exploded.add(id);

    const cells = blastCells(state, core.x, core.y, state.player.blastRange);
    for (const [x, y] of cells) {
      if (!state.blasts.some((b) => b.x === x && b.y === y)) {
        state.blasts.push({ x, y, ttlMs: BLAST_TTL_MS });
      }

      const chained = state.cores.find((candidate) =>
        !exploded.has(candidate.id) && candidate.x === x && candidate.y === y
      );
      if (chained) queue.push(chained.id);

      if (state.player.alive && state.player.x === x && state.player.y === y) {
        state.player.alive = false;
      }
    }
  }

  state.cores = state.cores.filter((core) => !exploded.has(core.id));
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
