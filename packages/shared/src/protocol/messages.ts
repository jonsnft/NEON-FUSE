import type { Direction, GridPosition } from "../types/game";

export const PROTOCOL_VERSION = 1 as const;

export type ClientIntent =
  | { type: "player.move"; version: 1; seq: number; direction: Direction }
  | { type: "core.place"; version: 1; seq: number; position: GridPosition }
  | { type: "match.ready"; version: 1 };
