export type TileKind = "floor" | "hard" | "soft";
export type PickupKind = "range" | "capacity" | "speed";

export interface SimPlayer {
  id: string;
  x: number;
  y: number;
  alive: boolean;
  speedTier: number;
  blastRange: number;
  coreCapacity: number;
}

export interface SimCore {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  fuseMs: number;
}

export interface SimBlast {
  x: number;
  y: number;
  ttlMs: number;
}

export interface SimPickup {
  x: number;
  y: number;
  kind: PickupKind;
  revealed: boolean;
}

export interface GameState {
  width: number;
  height: number;
  tiles: TileKind[];
  player: SimPlayer;
  cores: SimCore[];
  blasts: SimBlast[];
  pickups: SimPickup[];
  elapsedMs: number;
  nextCoreId: number;
}

export const indexOf = (state: Pick<GameState, "width">, x: number, y: number) =>
  y * state.width + x;

export const tileAt = (state: GameState, x: number, y: number): TileKind =>
  state.tiles[indexOf(state, x, y)];
