import type { CreatorMapDefinition } from "./types";
import type { GridPosition } from "../types/game";
import type { TileKind } from "../sim/types";

const ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const MIN_SIDE = 9;
const MAX_SIDE = 31;
const ALLOWED_KEYS = new Set([
  "id", "version", "displayName", "creatorId", "width", "height", "tiles", "spawnPoints"
]);

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isGridPosition = (value: unknown): value is GridPosition =>
  isObject(value) &&
  typeof value.x === "number" && Number.isInteger(value.x) &&
  typeof value.y === "number" && Number.isInteger(value.y) &&
  Object.keys(value).every((key) => key === "x" || key === "y");

const isTile = (value: unknown): value is TileKind =>
  value === "floor" || value === "hard" || value === "soft";

export function validateCreatorMap(input: unknown): ValidationResult<CreatorMapDefinition> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ["map must be an object"] };

  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) errors.push(`unsupported field: ${key}`);
  }

  const { id, version, displayName, creatorId, width, height, tiles, spawnPoints } = input;

  if (typeof id !== "string" || !ID.test(id)) errors.push("invalid map id");
  if (version !== 1) errors.push("version must be 1");
  if (typeof displayName !== "string" || displayName.length < 1 || displayName.length > 80) {
    errors.push("displayName must be 1..80 characters");
  }
  if (typeof creatorId !== "string" || !ID.test(creatorId)) errors.push("invalid creatorId");
  if (typeof width !== "number" || !Number.isInteger(width) || width < MIN_SIDE || width > MAX_SIDE || width % 2 === 0) {
    errors.push("width must be an odd integer between 9 and 31");
  }
  if (typeof height !== "number" || !Number.isInteger(height) || height < MIN_SIDE || height > MAX_SIDE || height % 2 === 0) {
    errors.push("height must be an odd integer between 9 and 31");
  }

  if (!Array.isArray(tiles)) errors.push("tiles must be an array");
  if (!Array.isArray(spawnPoints)) errors.push("spawnPoints must be an array");

  if (errors.length) return { ok: false, errors };

  const w = width as number;
  const h = height as number;
  const t = tiles as unknown[];
  const spawns = spawnPoints as unknown[];

  if (t.length !== w * h) errors.push("tiles length must equal width*height");
  if (!t.every(isTile)) errors.push("tiles contain invalid values");
  if (spawns.length < 2 || spawns.length > 8) errors.push("spawnPoints must contain 2..8 entries");
  if (!spawns.every(isGridPosition)) errors.push("spawnPoints contain invalid coordinates");

  if (errors.length) return { ok: false, errors };

  const typedTiles = t as TileKind[];
  const typedSpawns = spawns as GridPosition[];
  const index = (x: number, y: number) => y * w + x;

  for (let x = 0; x < w; x++) {
    if (typedTiles[index(x, 0)] !== "hard" || typedTiles[index(x, h - 1)] !== "hard") {
      errors.push("top and bottom borders must be hard");
      break;
    }
  }
  for (let y = 0; y < h; y++) {
    if (typedTiles[index(0, y)] !== "hard" || typedTiles[index(w - 1, y)] !== "hard") {
      errors.push("left and right borders must be hard");
      break;
    }
  }

  const seen = new Set<string>();
  for (const spawn of typedSpawns) {
    const key = `${spawn.x},${spawn.y}`;
    if (seen.has(key)) errors.push("spawn points must be unique");
    seen.add(key);

    if (spawn.x <= 0 || spawn.y <= 0 || spawn.x >= w - 1 || spawn.y >= h - 1) {
      errors.push("spawn point outside playable interior");
      continue;
    }
    if (typedTiles[index(spawn.x, spawn.y)] !== "floor") {
      errors.push("spawn points must be floor tiles");
    }

    const exits = [[1,0],[-1,0],[0,1],[0,-1]]
      .map(([dx, dy]) => typedTiles[index(spawn.x + dx, spawn.y + dy)])
      .filter((tile) => tile !== "hard").length;
    if (exits < 1) errors.push("every spawn requires at least one non-hard exit");
  }

  if (typedSpawns.length >= 2 && !allSpawnsConnected(w, h, typedTiles, typedSpawns)) {
    errors.push("all spawn points must be mutually reachable when soft blocks are treated as destructible");
  }

  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          id: id as string,
          version: 1,
          displayName: displayName as string,
          creatorId: creatorId as string,
          width: w,
          height: h,
          tiles: [...typedTiles],
          spawnPoints: typedSpawns.map((p) => ({ x: p.x, y: p.y }))
        },
        errors: []
      };
}

function allSpawnsConnected(
  width: number,
  height: number,
  tiles: TileKind[],
  spawns: GridPosition[]
): boolean {
  const index = (x: number, y: number) => y * width + x;
  const start = spawns[0];
  const queue: GridPosition[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  while (queue.length) {
    const current = queue.shift()!;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const x = current.x + dx;
      const y = current.y + dy;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      if (tiles[index(x, y)] === "hard") continue;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ x, y });
    }
  }

  return spawns.every((spawn) => visited.has(`${spawn.x},${spawn.y}`));
}
