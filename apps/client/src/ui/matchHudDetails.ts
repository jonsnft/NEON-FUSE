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
    : alive <= 2
      ? "FINAL DUEL — control lanes, force movement, survive your own blast paths."
      : "OUTLAST THE GRID — break soft blocks, build power, trap routes, survive contraction.";

  return {
    objective,
    items,
    telemetry: metrics
      ? [
          state.rules.gameModeId === "core-rush"
            ? `SCORE  ${scoreForPlayer(state, playerId)}/${mode.scoreTarget ?? "-"}`
            : `ELIMS  ${metrics.eliminations}`,
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

  return {
    objective: "SIGNAL REBOOT — read the active blast lanes now; you return with a short phase shield.",
    telemetry: [
      `REBOOT  ${(remainingMs / 1000).toFixed(1)}s`,
      `SCORE  ${scoreForPlayer(state, playerId)}/${mode.scoreTarget ?? "-"}`,
      `MATCH CHAINS  ${state.metrics.chainDetonations}`
    ]
  };
}

export function spectatingHudDetails(state: GameState): HudDetails {
  return {
    objective: "READ THE BOARD — watch safe lanes, chain timing and pickup routes for the next run.",
    telemetry: [
      `ALIVE  ${state.players.filter((player) => player.alive).length}/${state.players.length}`,
      `MATCH CHAINS  ${state.metrics.chainDetonations}`
    ]
  };
}

export function finishedHudDetails(state: GameState, playerId?: string): HudDetails {
  const metrics = playerId ? metricsForPlayer(state, playerId) : undefined;
  const mode = gameModePolicyForRules(state.rules);
  const telemetry = metrics
    ? [
        state.rules.gameModeId === "core-rush"
          ? `YOUR SCORE  ${metrics.eliminations}/${mode.scoreTarget ?? "-"}`
          : `YOUR ELIMS  ${metrics.eliminations}`,
        `YOUR CORES  ${metrics.coresPlaced}`,
        `YOUR PICKUPS  ${pickupTotal(metrics.pickupsCollected)}`,
        `SELF ELIMS  ${metrics.selfEliminations}`,
        `MATCH CHAINS  ${state.metrics.chainDetonations}`,
        state.metrics.reachedSuddenDeath ? "SUDDEN DEATH  REACHED" : "SUDDEN DEATH  NOT REACHED"
      ]
    : [`MATCH CHAINS  ${state.metrics.chainDetonations}`];

  return {
    objective: state.winnerId === playerId
      ? "DEFEND THE RESULT — rematch keeps the rivalry and map knowledge live."
      : "ADAPT NEXT RUN — change route, Core timing or pickup priority on the rematch.",
    telemetry
  };
}
