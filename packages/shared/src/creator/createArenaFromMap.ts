import { GAME } from "../constants/game";
import { DEFAULT_GAME_RULES, type GameRules } from "../rules/types";
import { pickupKindsForRules } from "../rules/catalog";
import type { SimPickup, SimPlayer, GameState } from "../sim/types";
import type { CreatorMapDefinition } from "./types";
import { validateCreatorMap } from "./validateMap";

function pickupCountForMatch(softCells: number, playerCount: number, allowedKinds: number): number {
  if (allowedKinds === 0 || softCells === 0) return 0;
  return Math.min(softCells, Math.max(allowedKinds, playerCount));
}

export function createArenaFromMap(
  map: CreatorMapDefinition,
  playerIds: string[],
  rules: GameRules = DEFAULT_GAME_RULES
): GameState {
  const validated = validateCreatorMap(map);
  if (!validated.ok || !validated.value) {
    throw new Error(`Invalid creator map: ${validated.errors.join("; ")}`);
  }
  if (playerIds.length < 1 || playerIds.length > 8) {
    throw new Error("createArenaFromMap supports 1 to 8 players");
  }
  if (playerIds.length > validated.value.spawnPoints.length) {
    throw new Error("map does not contain enough spawn points");
  }

  const mapValue = validated.value;
  const players: SimPlayer[] = playerIds.map((id, index) => {
    const spawn = mapValue.spawnPoints[index];
    return {
      id,
      x: spawn.x,
      y: spawn.y,
      alive: true,
      speedTier: 0,
      blastRange: 1,
      coreCapacity: 1
    };
  });

  const softCells = mapValue.tiles
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile === "soft")
    .map(({ index }) => ({ x: index % mapValue.width, y: Math.floor(index / mapValue.width) }));

  const pickupKinds = [...pickupKindsForRules(rules)];
  const targetPickupCount = pickupCountForMatch(softCells.length, playerIds.length, pickupKinds.length);
  const pickupPositions = Array.from({ length: targetPickupCount }, (_, index) => {
    if (targetPickupCount === 1) return softCells[Math.floor(softCells.length / 2)];
    const position = Math.round(index * (softCells.length - 1) / (targetPickupCount - 1));
    return softCells[position];
  });
  const pickups: SimPickup[] = pickupPositions.map((position, index) => ({
    ...position,
    kind: pickupKinds[index % pickupKinds.length],
    revealed: false
  }));

  return {
    mapId: mapValue.id,
    rules: { ...rules },
    width: mapValue.width,
    height: mapValue.height,
    tiles: [...mapValue.tiles],
    players,
    cores: [],
    blasts: [],
    pickups,
    metrics: {
      chainDetonations: 0,
      reachedSuddenDeath: false,
      players: playerIds.map((playerId, spawnIndex) => ({
        playerId,
        spawnIndex,
        coresPlaced: 0,
        pickupsCollected: { range: 0, capacity: 0, speed: 0 },
        eliminatedAtMs: null
      }))
    },
    elapsedMs: 0,
    roundDurationMs: GAME.targetMatchSeconds * 1000,
    suddenDeathStartMs: GAME.suddenDeathStartSeconds * 1000,
    suddenDeathCursor: 0,
    nextCoreId: 1,
    phase: "playing",
    winnerId: null
  };
}
