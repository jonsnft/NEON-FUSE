import type { CreatorMapDefinition } from "../creator/types";
import { createArenaFromMap } from "../creator/createArenaFromMap";
import { validateCreatorMap } from "../creator/validateMap";
import type { GameState, TileKind } from "../sim/types";
import type { GridPosition } from "../types/game";

export const OFFICIAL_MAP_IDS = ["grid-zero", "data-cross", "switchyard"] as const;
export type OfficialMapId = typeof OFFICIAL_MAP_IDS[number];

const WIDTH = 15;
const HEIGHT = 13;

const spawns: GridPosition[] = [
  { x: 1, y: 1 },
  { x: WIDTH - 2, y: HEIGHT - 2 },
  { x: WIDTH - 2, y: 1 },
  { x: 1, y: HEIGHT - 2 },
  { x: 1, y: Math.floor(HEIGHT / 2) },
  { x: WIDTH - 2, y: Math.floor(HEIGHT / 2) },
  { x: Math.floor(WIDTH / 2), y: 1 },
  { x: Math.floor(WIDTH / 2), y: HEIGHT - 2 }
];

type Variant = "grid" | "cross" | "lanes";

function buildOfficialMap(
  id: OfficialMapId,
  displayName: string,
  variant: Variant
): CreatorMapDefinition {
  const tiles: TileKind[] = Array.from({ length: WIDTH * HEIGHT }, () => "floor");
  const index = (x: number, y: number) => y * WIDTH + x;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1;
      let hard = border;

      if (!hard && variant === "grid") {
        hard = x % 2 === 0 && y % 2 === 0;
      } else if (!hard && variant === "cross") {
        hard =
          (x % 2 === 0 && y % 2 === 0) ||
          (x === 7 && y >= 3 && y <= 9 && y !== 6) ||
          (y === 6 && x >= 4 && x <= 10 && x !== 7);
      } else if (!hard && variant === "lanes") {
        hard =
          (x === 4 || x === 10) && y % 3 !== 1 ||
          (y === 4 || y === 8) && x % 4 === 0;
      }

      if (hard) tiles[index(x, y)] = "hard";
    }
  }

  const safe = new Set<string>();
  for (const spawn of spawns) {
    safe.add(`${spawn.x},${spawn.y}`);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const x = spawn.x + dx;
      const y = spawn.y + dy;
      if (x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1) {
        safe.add(`${x},${y}`);
        tiles[index(x, y)] = "floor";
      }
    }
    tiles[index(spawn.x, spawn.y)] = "floor";
  }

  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
      const i = index(x, y);
      if (tiles[i] !== "floor" || safe.has(`${x},${y}`)) continue;
      const salt = variant === "grid" ? 11 : variant === "cross" ? 23 : 37;
      if ((x * 17 + y * 31 + salt) % 7 < 4) tiles[i] = "soft";
    }
  }

  const map: CreatorMapDefinition = {
    id,
    version: 1,
    displayName,
    creatorId: "neon-fuse",
    width: WIDTH,
    height: HEIGHT,
    tiles,
    spawnPoints: spawns.map((spawn) => ({ ...spawn }))
  };

  const validation = validateCreatorMap(map);
  if (!validation.ok || !validation.value) {
    throw new Error(`Invalid official map ${id}: ${validation.errors.join("; ")}`);
  }
  return validation.value;
}

export const OFFICIAL_MAPS: Readonly<Record<OfficialMapId, CreatorMapDefinition>> = {
  "grid-zero": buildOfficialMap("grid-zero", "Grid Zero", "grid"),
  "data-cross": buildOfficialMap("data-cross", "Data Cross", "cross"),
  "switchyard": buildOfficialMap("switchyard", "Switchyard", "lanes")
};

export function normalizeOfficialMapId(value: unknown): OfficialMapId {
  return typeof value === "string" && (OFFICIAL_MAP_IDS as readonly string[]).includes(value)
    ? value as OfficialMapId
    : "grid-zero";
}

export function createOfficialArena(mapId: OfficialMapId, playerIds: string[]): GameState {
  return createArenaFromMap(OFFICIAL_MAPS[mapId], playerIds);
}
