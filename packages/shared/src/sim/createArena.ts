import { GAME } from "../constants/game";
import { gameModePolicyForRules, pickupKindsForRules } from "../rules/catalog";
import { DEFAULT_GAME_RULES, type GameRules } from "../rules/types";
import { createControlNodes } from "./objectives";
import { distributePickups } from "./pickups";
import type { GameState, SimPlayer, TeamId, TileKind } from "./types";
import { indexOf } from "./types";

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

const teamForSpawn = (spawnIndex: number): TeamId => spawnIndex % 2 === 0 ? "alpha" : "beta";

export function createArena(
  playerIds: string[] = ["local-player"],
  rules: GameRules = DEFAULT_GAME_RULES
): GameState {
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

  const softCells: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[indexOf({ width }, x, y)] === "soft") softCells.push({ x, y });
    }
  }
  const pickups = distributePickups(softCells, playerIds.length, pickupKindsForRules(rules));
  const mode = gameModePolicyForRules(rules);

  const players: SimPlayer[] = playerIds.map((id, i) => {
    const [x, y] = spawnPoints[i];
    return {
      id,
      teamId: mode.teamPolicy === "two-teams" ? teamForSpawn(i) : null,
      x,
      y,
      spawnX: x,
      spawnY: y,
      alive: true,
      respawnAtMs: null,
      invulnerableUntilMs: 0,
      speedTier: 0,
      blastRange: GAME.initialBlastRange,
      coreCapacity: GAME.initialCoreCapacity
    };
  });
  const controlNodes = createControlNodes(width, height, tiles, players, rules);

  return {
    mapId: "grid-zero",
    rules: { ...rules },
    width,
    height,
    tiles,
    players,
    cores: [],
    blasts: [],
    pickups,
    controlNodes,
    metrics: {
      chainDetonations: 0,
      reachedSuddenDeath: false,
      players: playerIds.map((playerId, spawnIndex) => ({
        playerId,
        spawnIndex,
        coresPlaced: 0,
        pickupsCollected: { range: 0, capacity: 0, speed: 0 },
        eliminations: 0,
        selfEliminations: 0,
        objectivePoints: 0,
        nodesCaptured: 0,
        eliminatedAtMs: null,
        eliminatedByPlayerId: null
      }))
    },
    elapsedMs: 0,
    roundDurationMs: mode.roundDurationMs,
    suddenDeathStartMs: GAME.suddenDeathStartSeconds * 1000,
    suddenDeathCursor: 0,
    nextCoreId: 1,
    phase: "playing",
    winnerId: null,
    winnerTeamId: null
  };
}
