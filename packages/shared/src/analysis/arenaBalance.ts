import type { CreatorMapDefinition } from "../creator/types";
import type { GridPosition } from "../types/game";

export interface ArenaBalanceMetrics {
  width: number;
  height: number;
  hardTiles: number;
  softTiles: number;
  floorTiles: number;
  traversablePotentialTiles: number;
  softRatioOfPotentialSpace: number;
  spawnEgress: number[];
  minSpawnEgress: number;
  minSpawnManhattanDistance: number;
}

export function analyzeArenaBalance(map: CreatorMapDefinition): ArenaBalanceMetrics {
  let hardTiles = 0;
  let softTiles = 0;
  let floorTiles = 0;

  for (const tile of map.tiles) {
    if (tile === "hard") hardTiles++;
    else if (tile === "soft") softTiles++;
    else floorTiles++;
  }

  const traversablePotentialTiles = floorTiles + softTiles;
  const softRatioOfPotentialSpace = traversablePotentialTiles === 0
    ? 0
    : softTiles / traversablePotentialTiles;

  const spawnEgress = map.spawnPoints.map((spawn) => immediateFloorEgress(map, spawn));
  const minSpawnEgress = spawnEgress.length > 0 ? Math.min(...spawnEgress) : 0;
  const minSpawnManhattanDistance = minimumSpawnDistance(map.spawnPoints);

  return {
    width: map.width,
    height: map.height,
    hardTiles,
    softTiles,
    floorTiles,
    traversablePotentialTiles,
    softRatioOfPotentialSpace,
    spawnEgress,
    minSpawnEgress,
    minSpawnManhattanDistance
  };
}

function immediateFloorEgress(map: CreatorMapDefinition, spawn: GridPosition): number {
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
  let count = 0;

  for (const [dx, dy] of directions) {
    const x = spawn.x + dx;
    const y = spawn.y + dy;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
    if (map.tiles[y * map.width + x] === "floor") count++;
  }

  return count;
}

function minimumSpawnDistance(spawns: GridPosition[]): number {
  if (spawns.length < 2) return 0;

  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < spawns.length; i++) {
    for (let j = i + 1; j < spawns.length; j++) {
      const distance = Math.abs(spawns[i].x - spawns[j].x) + Math.abs(spawns[i].y - spawns[j].y);
      minimum = Math.min(minimum, distance);
    }
  }

  return Number.isFinite(minimum) ? minimum : 0;
}
