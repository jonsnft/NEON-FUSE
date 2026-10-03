import {
  movePlayer,
  placeCore,
  type ClientIntent,
  type GameState
} from "@neon-fuse/shared";

export interface IntentSequenceState {
  get(playerId: string): number | undefined;
  set(playerId: string, seq: number): unknown;
}

export function applyClientIntent(
  game: GameState,
  playerId: string,
  intent: ClientIntent,
  lastSeq: IntentSequenceState
): boolean {
  if (
    intent.type === "match.ready" ||
    intent.type === "match.start" ||
    intent.type === "match.rematch"
  ) return false;

  const previous = lastSeq.get(playerId) ?? -1;
  if (intent.seq <= previous) return false;
  lastSeq.set(playerId, intent.seq);

  if (intent.type === "player.move") {
    return movePlayer(game, playerId, intent.direction);
  }

  return placeCore(game, playerId);
}
