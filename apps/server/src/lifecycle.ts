export const MIN_PLAYERS = 2;
export const HARD_MAX_PLAYERS = 8;

export function clampMaxPlayers(value: unknown): number {
  const requested = Number(value);
  if (!Number.isFinite(requested)) return HARD_MAX_PLAYERS;
  return Math.min(HARD_MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.floor(requested)));
}

export function everyConnectedHasVoted(
  connectedIds: readonly string[],
  votes: ReadonlySet<string>
): boolean {
  return connectedIds.length >= MIN_PLAYERS && connectedIds.every((id) => votes.has(id));
}

export function idsExcluding(
  connectedIds: readonly string[],
  leavingId: string
): string[] {
  return connectedIds.filter((id) => id !== leavingId);
}
