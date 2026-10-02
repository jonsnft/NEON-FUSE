import type { SimPlayer, GameState } from "../sim/types";
import type { CreatorMapDefinition } from "./types";
import { validateCreatorMap } from "./validateMap";

export function createArenaFromMap(
  map: CreatorMapDefinition,
  playerIds: string[]
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

  return {
    width: mapValue.width,
    height: mapValue.height,
    tiles: [...mapValue.tiles],
    players,
    cores: [],
    blasts: [],
    pickups: [],
    elapsedMs: 0,
    nextCoreId: 1,
    phase: "playing",
    winnerId: null
  };
}
