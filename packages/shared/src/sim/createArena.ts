import { GAME } from "../constants/game";
import type { GameState, SimPickup, SimPlayer, TileKind } from "./types";
import { indexOf } from "./types";

const pickupPlan: SimPickup[] = [
  { x: 3, y: 1, kind: "range", revealed: false },
  { x: 5, y: 1, kind: "capacity", revealed: false },
  { x: 7, y: 1, kind: "speed", revealed: false }
];

const spawnPoints = [
  [1, 1],
  [GAME.gridWidth - 2, GAME.gridHeight - 2],
  [GAME.gridWidth - 2, 1],
  [1, GAME.gridHeight - 2],
  [1, Math.floor(GAME.gridHeight / 2)],
  [GAME.gridWidth - 2, Math.floor(GAME.gridHeight / 2)],
  [Math.floor(GAME.gridWidth / 2), 1],
  [Math.floor(GAME.gridWidth / 2), GAME.gridHeight - 2]
] as const;

export function createArena(playerIds: string[] = ["local-player"]): GameState {
  if (playerIds.length < 1 || playerIds.length > 8) {
    throw new Error("createArena supports 1 to 8 players");
  }

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

  const safe = new Set<string>();
  for (let i = 0; i < playerIds.length; i++) {
    const [sx, sy] = spawnPoints[i];
    safe.add(`${sx},${sy}`);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const x = sx + dx;
      const y = sy + dy;
      if (x > 0 && y > 0 && x < width - 1 && y < height - 1) safe.add(`${x},${y}`);
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = indexOf({ width }, x, y);
      if (tiles[i] !== "floor" || safe.has(`${x},${y}`)) continue;
      if ((x * 17 + y * 31) % 5 < 3) tiles[i] = "soft";
    }
  }

  for (const pickup of pickupPlan) {
    if (!safe.has(`${pickup.x},${pickup.y}`)) {
      tiles[indexOf({ width }, pickup.x, pickup.y)] = "soft";
    }
  }

  const players: SimPlayer[] = playerIds.map((id, i) => {
    const [x, y] = spawnPoints[i];
    return {
      id,
      x,
      y,
      alive: true,
      speedTier: 0,
      blastRange: GAME.initialBlastRange,
      coreCapacity: GAME.initialCoreCapacity
    };
  });

  return {
    width,
    height,
    tiles,
    players,
    cores: [],
    blasts: [],
    pickups: pickupPlan.filter((p) => !safe.has(`${p.x},${p.y}`)).map((p) => ({ ...p })),
    elapsedMs: 0,
    nextCoreId: 1,
    phase: "playing",
    winnerId: null
  };
}
