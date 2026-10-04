import { gameModePolicyForRules, suddenDeathEnabledForRules } from "../rules/catalog";
import { updateControlObjectives } from "./objectives";
import type { GameState, SimPlayer } from "./types";
import { indexOf, metricsForPlayer, scoreForPlayer, tileAt } from "./types";
import { applySuddenDeath, enforceRoundDeadline } from "./suddenDeath";

const BLAST_TTL_MS = 260;

export function tickSimulation(state: GameState, deltaMs: number): void {
  state.elapsedMs += deltaMs;
  for (const blast of state.blasts) blast.ttlMs -= deltaMs;
  state.blasts = state.blasts.filter((blast) => blast.ttlMs > 0);

  if (state.phase !== "playing") return;

  respawnDuePlayers(state);

  if (suddenDeathEnabledForRules(state.rules) && state.elapsedMs >= state.suddenDeathStartMs) {
    state.metrics.reachedSuddenDeath = true;
  }

  for (const core of state.cores) core.fuseMs -= deltaMs;

  const queue = state.cores.filter((core) => core.fuseMs <= 0).map((core) => core.id);
  const queued = new Set(queue);
  const exploded = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (exploded.has(id)) continue;
    const core = state.cores.find((candidate) => candidate.id === id);
    if (!core) continue;
    exploded.add(id);

    const cells = blastCells(state, core.x, core.y, core.blastRange);
    for (const [x, y] of cells) {
      if (!state.blasts.some((b) => b.x === x && b.y === y)) {
        state.blasts.push({
          x,
          y,
          ttlMs: BLAST_TTL_MS,
          ownerId: core.ownerId,
          sourceCoreId: core.id
        });
      }

      const chained = state.cores.find((candidate) =>
        !exploded.has(candidate.id) && candidate.x === x && candidate.y === y
      );
      if (chained && !queued.has(chained.id)) {
        queued.add(chained.id);
        queue.push(chained.id);
        state.metrics.chainDetonations++;
      }

      for (const player of state.players) {
        if (
          player.alive &&
          player.invulnerableUntilMs <= state.elapsedMs &&
          player.x === x &&
          player.y === y
        ) {
          eliminatePlayer(state, player, core.ownerId);
        }
      }
    }
  }

  state.cores = state.cores.filter((core) => !exploded.has(core.id));
  applySuddenDeath(state);
  updateControlObjectives(state, deltaMs);
  resolveRound(state);
  enforceRoundDeadline(state);
}

function eliminatePlayer(state: GameState, player: SimPlayer, sourceOwnerId: string): void {
  player.alive = false;
  const mode = gameModePolicyForRules(state.rules);
  player.respawnAtMs = mode.respawnDelayMs === null ? null : state.elapsedMs + mode.respawnDelayMs;

  const victimMetrics = metricsForPlayer(state, player.id);
  if (victimMetrics) {
    victimMetrics.eliminatedAtMs = state.elapsedMs;
    victimMetrics.eliminatedByPlayerId = sourceOwnerId;
    if (player.id === sourceOwnerId) victimMetrics.selfEliminations++;
  }

  if (player.id !== sourceOwnerId) {
    const sourceMetrics = metricsForPlayer(state, sourceOwnerId);
    if (sourceMetrics) sourceMetrics.eliminations++;
  }
}

function respawnDuePlayers(state: GameState): void {
  const mode = gameModePolicyForRules(state.rules);
  if (mode.respawnDelayMs === null) return;

  for (const player of state.players) {
    if (player.alive || player.respawnAtMs === null || state.elapsedMs < player.respawnAtMs) continue;
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.alive = true;
    player.respawnAtMs = null;
    player.invulnerableUntilMs = state.elapsedMs + mode.respawnShieldMs;
  }
}

export function resolveRound(state: GameState): void {
  if (state.phase !== "playing" || state.players.length < 2) return;
  const mode = gameModePolicyForRules(state.rules);

  if (mode.teamPolicy === "two-teams") {
    const aliveTeams = new Set(
      state.players
        .filter((player) => player.alive && player.teamId)
        .map((player) => player.teamId!)
    );
    if (aliveTeams.size <= 1) {
      state.phase = "finished";
      state.winnerId = null;
      state.winnerTeamId = aliveTeams.values().next().value ?? null;
    }
    return;
  }

  if (state.rules.gameModeId === "classic-deathmatch") {
    const alive = state.players.filter((player) => player.alive);
    if (alive.length <= 1) {
      state.phase = "finished";
      state.winnerId = alive[0]?.id ?? null;
      state.winnerTeamId = null;
    }
    return;
  }

  if (mode.scoreTarget === null) return;
  const scores = state.players.map((player) => ({
    id: player.id,
    score: scoreForPlayer(state, player.id)
  }));
  const best = Math.max(...scores.map(({ score }) => score));
  if (best < mode.scoreTarget) return;
  const leaders = scores.filter(({ score }) => score === best);
  if (leaders.length !== 1) return;

  state.phase = "finished";
  state.winnerId = leaders[0].id;
  state.winnerTeamId = null;
}

function blastCells(state: GameState, originX: number, originY: number, range: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [[originX, originY]];
  const directions = [[1,0],[-1,0],[0,1],[0,-1]] as const;

  for (const [dx, dy] of directions) {
    for (let distance = 1; distance <= range; distance++) {
      const x = originX + dx * distance;
      const y = originY + dy * distance;
      const tile = tileAt(state, x, y);
      if (tile === "hard") break;

      cells.push([x, y]);

      if (tile === "soft") {
        state.tiles[indexOf(state, x, y)] = "floor";
        const pickup = state.pickups.find((p) => p.x === x && p.y === y);
        if (pickup) pickup.revealed = true;
        break;
      }
    }
  }

  return cells;
}
