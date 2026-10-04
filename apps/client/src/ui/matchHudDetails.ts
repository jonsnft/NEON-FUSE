import {
  metricsForPlayer,
  pickupKindsForRules,
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
  const items = pickupKindsForRules(state.rules).map((kind) => ({
    ...ITEM_INFO[kind],
    current: currentForKind(player, kind)
  }));

  return {
    objective: alive <= 2
      ? "FINAL DUEL — control lanes, force movement, survive your own blast paths."
      : "OUTLAST THE GRID — break soft blocks, build power, trap routes, survive contraction.",
    items,
    telemetry: metrics
      ? [
          `CORES PLACED  ${metrics.coresPlaced}`,
          `PICKUPS  ${pickupTotal(metrics.pickupsCollected)}`,
          `ELIMS  ${metrics.eliminations}`,
          `MATCH CHAINS  ${state.metrics.chainDetonations}`
        ]
      : []
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
  const telemetry = metrics
    ? [
        `YOUR CORES  ${metrics.coresPlaced}`,
        `YOUR PICKUPS  ${pickupTotal(metrics.pickupsCollected)}`,
        `YOUR ELIMS  ${metrics.eliminations}`,
        metrics.selfEliminations > 0 ? `SELF ELIMS  ${metrics.selfEliminations}` : "SELF ELIMS  0",
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
