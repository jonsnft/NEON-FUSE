import { GAME } from "../constants/game";
import type { GameState, SimPickup, TileKind } from "./types";
import { indexOf } from "./types";

const pickupPlan: SimPickup[] = [
  { x: 3, y: 1, kind: "range", revealed: false },
  { x: 5, y: 1, kind: "capacity", revealed: false },
  { x: 7, y: 1, kind: "speed", revealed: false }
];

export function createArena(): GameState {
  const width = GAME.gridWidth;
  const height = GAME.gridHeight;
  const tiles: TileKind[] = Array.from({ length: width * height }, () => "floor");

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      if (border || pillar) tiles[indexOf({ width }, x, y)] = "hard";
    }
  }

  const spawnSafe = new Set(["1,1", "2,1", "1,2"]);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = indexOf({ width }, x, y);
      if (tiles[i] !== "floor" || spawnSafe.has(`${x},${y}`)) continue;
      if ((x * 17 + y * 31) % 5 < 3) tiles[i] = "soft";
    }
  }

  for (const pickup of pickupPlan) {
    tiles[indexOf({ width }, pickup.x, pickup.y)] = "soft";
  }

  return {
    width,
    height,
    tiles,
    player: {
      id: "local-player",
      x: 1,
      y: 1,
      alive: true,
      speedTier: 0,
      blastRange: GAME.initialBlastRange,
      coreCapacity: GAME.initialCoreCapacity
    },
    cores: [],
    blasts: [],
    pickups: pickupPlan.map((p) => ({ ...p })),
    elapsedMs: 0,
    nextCoreId: 1
  };
}
