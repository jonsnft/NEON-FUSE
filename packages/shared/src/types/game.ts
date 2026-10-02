export type PlayerId = string;

export type Direction = "up" | "down" | "left" | "right";

export interface GridPosition {
  x: number;
  y: number;
}

export interface PlayerState extends GridPosition {
  id: PlayerId;
  alive: boolean;
  speedTier: number;
  blastRange: number;
  coreCapacity: number;
}

export interface CoreState extends GridPosition {
  id: string;
  ownerId: PlayerId;
  explodeAtMs: number;
}
