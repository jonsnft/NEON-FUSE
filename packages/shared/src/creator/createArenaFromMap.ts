import { GAME } from "../constants/game";
import { DEFAULT_GAME_RULES, type GameRules } from "../rules/types";
import { gameModePolicyForRules, pickupKindsForRules } from "../rules/catalog";
import { createControlNodes } from "../sim/objectives";
import { distributePickups } from "../sim/pickups";
import type { SimPlayer, GameState } from "../sim/types";
import type { CreatorMapDefinition } from "./types";
import { validateCreatorMap } from "./validateMap";

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
      spawnX: spawn.x,
      spawnY: spawn.y,
      alive: true,
      respawnAtMs: null,
      invulnerableUntilMs: 0,
      speedTier: 0,
      blastRange: 1,
      coreCapacity: 1
    };
  });

  const softCells = mapValue.tiles
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile === "soft")
    .map(({ index }) => ({ x: index % mapValue.width, y: Math.floor(index / mapValue.width) }));

  const pickups = distributePickups(
    softCells,
    playerIds.length,
    pickupKindsForRules(rules)
  );
  const mode = gameModePolicyForRules(rules);
  const controlNodes = createControlNodes(
    mapValue.width,
    mapValue.height,
    mapValue.tiles,
    players,
    rules
  );

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
    winnerId: null
  };
}
