import {
  gameModePolicyForRules,
  metricsForPlayer,
  pickupKindsForRules,
  scoreForPlayer,
  type GameState,
  type PickupKind,
  type SimPlayer
} from "@neon-fuse/shared";
import type { HudDetails, HudItemInfo } from "./MatchHud";

const ITEM_INFO: Record<PickupKind, Omit<HudItemInfo, "current">> = {
  range: {
    name: "RANGE",
    glyph: "R+",
    description: "Blast reaches +1 tile in every cardinal direction."
  },
  capacity: {
    name: "CORE CAP",
    glyph: "C+",
    description: "Adds +1 simultaneous Energy Core."
  },
  speed: {
    name: "SPEED",
    glyph: "S+",
    description: "Raises movement speed by one tier."
  }
};

const currentForKind = (player: SimPlayer, kind: PickupKind): string => {
  if (kind === "range") return `NOW ${player.blastRange}`;
  if (kind === "capacity") return `NOW ${player.coreCapacity}`;
  return `TIER ${player.speedTier}`;
};

const pickupTotal = (values: Record<PickupKind, number>): number =>
  values.range + values.capacity + values.speed;

export function playingHudDetails(
  state: GameState,
  playerId: string,
  player: SimPlayer,
  alive: number
): HudDetails {
  const metrics = metricsForPlayer(state, playerId);
  const mode = gameModePolicyForRules(state.rules);
  const items = pickupKindsForRules(state.rules).map((kind) => ({
    ...ITEM_INFO[kind],
    current: currentForKind(player, kind)
  }));

  const objective = state.rules.gameModeId === "core-rush"
    ? `CORE RUSH — score ${mode.scoreTarget ?? 0} clean eliminations. Reboot after a hit; pressure lanes instead of hiding.`
    : state.rules.gameModeId === "grid-control"
      ? `GRID CONTROL — capture a DATA NODE, then stay linked to upload SYNC. Contested nodes stop scoring; first to ${mode.scoreTarget ?? 0} wins.`
      : state.rules.gameModeId === "classic-team-deathmatch"
        ? `CLASSIC TEAM DEATHMATCH — TEAM ${player.teamId?.toUpperCase() ?? "-"}. No respawns. Eliminate the opposing team; friendly blast paths still matter.`
        : alive <= 2
          ? "CLASSIC DEATHMATCH — FINAL DUEL. No respawns. Last player standing wins."
          : "CLASSIC DEATHMATCH — break soft blocks, collect power-ups and survive. No respawns; last player standing wins.";

  const modeScore = state.rules.gameModeId === "grid-control"
    ? `SYNC  ${scoreForPlayer(state, playerId)}/${mode.scoreTarget ?? "-"}`
    : state.rules.gameModeId === "core-rush"
      ? `SCORE  ${scoreForPlayer(state, playerId)}/${mode.scoreTarget ?? "-"}`
      : state.rules.gameModeId === "classic-team-deathmatch"
        ? `TEAM  ${player.teamId?.toUpperCase() ?? "-"}`
        : `ELIMS  ${metrics?.eliminations ?? 0}`;

  return {
    objective,
    items,
    telemetry: metrics
      ? [
          modeScore,
          ...(state.rules.gameModeId === "grid-control" ? [`NODES CAPTURED  ${metrics.nodesCaptured}`] : []),
          `CORES PLACED  ${metrics.coresPlaced}`,
          `PICKUPS  ${pickupTotal(metrics.pickupsCollected)}`,
          `MATCH CHAINS  ${state.metrics.chainDetonations}`
        ]
      : []
  };
}

export function rebootHudDetails(state: GameState, playerId: string): HudDetails {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const mode = gameModePolicyForRules(state.rules);
  const remainingMs = player?.respawnAtMs === null || player?.respawnAtMs === undefined
    ? 0
    : Math.max(0, player.respawnAtMs - state.elapsedMs);
  const scoreLabel = state.rules.gameModeId === "grid-control" ? "SYNC" : "SCORE";

  return {
    objective: state.rules.gameModeId === "grid-control"
      ? "SIGNAL REBOOT — read which DATA NODE is exposed; return under phase shield and contest the uplink."
      : "SIGNAL REBOOT — read the active blast lanes now; you return with a short phase shield.",
    telemetry: [
      `REBOOT  ${(remainingMs / 1000).toFixed(1)}s`,
      `${scoreLabel}  ${scoreForPlayer(state, playerId)}/${mode.scoreTarget ?? "-"}`,
      `MATCH CHAINS  ${state.metrics.chainDetonations}`
    ]
  };
}

export function spectatingHudDetails(state: GameState): HudDetails {
  return {
    objective: state.rules.gameModeId === "classic-team-deathmatch"
      ? "TEAM BATTLE — your run is over, but your team can still win. Read the remaining lanes and blast pressure."
      : "READ THE BOARD — watch safe lanes, chain timing and pickup routes for the next run.",
    telemetry: [
      `ALIVE  ${state.players.filter((player) => player.alive).length}/${state.players.length}`,
      `MATCH CHAINS  ${state.metrics.chainDetonations}`
    ]
  };
}

export function finishedHudDetails(state: GameState, playerId?: string): HudDetails {
  const metrics = playerId ? metricsForPlayer(state, playerId) : undefined;
  const player = playerId ? state.players.find((candidate) => candidate.id === playerId) : undefined;
  const mode = gameModePolicyForRules(state.rules);
  const won = state.rules.gameModeId === "classic-team-deathmatch"
    ? Boolean(player?.teamId && state.winnerTeamId === player.teamId)
    : state.winnerId === playerId;
  const telemetry = metrics
    ? [
        state.rules.gameModeId === "grid-control"
          ? `YOUR SYNC  ${metrics.objectivePoints}/${mode.scoreTarget ?? "-"}`
          : state.rules.gameModeId === "core-rush"
            ? `YOUR SCORE  ${metrics.eliminations}/${mode.scoreTarget ?? "-"}`
            : state.rules.gameModeId === "classic-team-deathmatch"
              ? `YOUR TEAM  ${player?.teamId?.toUpperCase() ?? "-"}`
              : `YOUR ELIMS  ${metrics.eliminations}`,
        ...(state.rules.gameModeId === "grid-control" ? [`NODES CAPTURED  ${metrics.nodesCaptured}`] : []),
        `YOUR CORES  ${metrics.coresPlaced}`,
        `YOUR PICKUPS  ${pickupTotal(metrics.pickupsCollected)}`,
        `SELF ELIMS  ${metrics.selfEliminations}`,
        `MATCH CHAINS  ${state.metrics.chainDetonations}`,
        state.metrics.reachedSuddenDeath ? "SUDDEN DEATH  REACHED" : "SUDDEN DEATH  NOT REACHED"
      ]
    : [`MATCH CHAINS  ${state.metrics.chainDetonations}`];

  return {
    objective: won
      ? "DEFEND THE RESULT — rematch keeps the rivalry and map knowledge live."
      : "ADAPT NEXT RUN — change route, Core timing or pickup priority on the rematch.",
    telemetry
  };
}
