import { GAME } from "../constants/game";
import { DEFAULT_GAME_RULES, type GameRules } from "../rules/types";
import { pickupKindsForRules } from "../rules/catalog";
import type { SimPickup, SimPlayer, GameState } from "../sim/types";
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
  const pickupPositions =
    softCells.length <= pickupKinds.length
      ? softCells
      : pickupKinds.map((_, index) => {
          if (pickupKinds.length === 1) return softCells[Math.floor(softCells.length / 2)];
          const position = Math.round(index * (softCells.length - 1) / (pickupKinds.length - 1));
          return softCells[position];
        });
  const pickups: SimPickup[] = pickupPositions.map((position, i) => ({
    ...position,
    kind: pickupKinds[i],
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
    elapsedMs: 0,
    roundDurationMs: GAME.targetMatchSeconds * 1000,
    suddenDeathStartMs: GAME.suddenDeathStartSeconds * 1000,
    suddenDeathCursor: 0,
    nextCoreId: 1,
    phase: "playing",
    winnerId: null
  };
}
