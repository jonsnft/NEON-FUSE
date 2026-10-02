import type { Direction } from "../types/game";
import type { GameState } from "../sim/types";

export const PROTOCOL_VERSION = 1 as const;

export type ClientIntent =
  | { type: "player.move"; version: 1; seq: number; direction: Direction }
  | { type: "core.place"; version: 1; seq: number }
  | { type: "match.ready"; version: 1 };

export type MatchSnapshot =
  | {
      type: "match.snapshot";
      version: 1;
      status: "waiting";
      connectedPlayers: number;
      requiredPlayers: number;
    }
  | {
      type: "match.snapshot";
      version: 1;
      status: "playing" | "finished";
      game: GameState;
    };

export function isClientIntent(value: unknown): value is ClientIntent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== PROTOCOL_VERSION || typeof candidate.type !== "string") return false;

  if (candidate.type === "player.move") {
    return (
      Number.isInteger(candidate.seq) &&
      ["up", "down", "left", "right"].includes(String(candidate.direction))
    );
  }

  if (candidate.type === "core.place") {
    return Number.isInteger(candidate.seq);
  }

  return candidate.type === "match.ready";
}
