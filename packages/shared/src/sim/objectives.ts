import { gameModePolicyForRules } from "../rules/catalog";
import type { GameRules } from "../rules/types";
import type { GameState, SimControlNode, SimPlayer, TileKind } from "./types";
import { indexOf, metricsForPlayer } from "./types";

interface Cell {
  x: number;
  y: number;
}

const cellKey = ({ x, y }: Cell): string => `${x},${y}`;

function nearestFloor(
  width: number,
  height: number,
  tiles: TileKind[],
  anchor: Cell,
  blocked: Set<string>
): Cell | null {
  const candidates: Array<Cell & { distance: number }> = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tiles[indexOf({ width }, x, y)] !== "floor") continue;
      const cell = { x, y };
      if (blocked.has(cellKey(cell))) continue;
      candidates.push({ x, y, distance: Math.abs(x - anchor.x) + Math.abs(y - anchor.y) });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
  return candidates[0] ?? null;
}

export function createControlNodes(
  width: number,
  height: number,
  tiles: TileKind[],
  players: readonly SimPlayer[],
  rules: GameRules
): SimControlNode[] {
  const policy = gameModePolicyForRules(rules);
  const config = policy.control;
  if (!config) return [];

  const blocked = new Set(players.map((player) => `${player.spawnX},${player.spawnY}`));
  const anchors: Cell[] = [
    { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    { x: Math.floor(width / 3), y: Math.floor(height / 2) },
    { x: Math.floor((width * 2) / 3), y: Math.floor(height / 2) },
    { x: Math.floor(width / 2), y: Math.floor(height / 3) },
    { x: Math.floor(width / 2), y: Math.floor((height * 2) / 3) }
  ];

  const nodes: SimControlNode[] = [];
  for (const anchor of anchors) {
    if (nodes.length >= config.nodeCount) break;
    const cell = nearestFloor(width, height, tiles, anchor, blocked);
    if (!cell) break;
    blocked.add(cellKey(cell));
    nodes.push({
      id: `node-${nodes.length + 1}`,
      x: cell.x,
      y: cell.y,
      ownerId: null,
      capturingPlayerId: null,
      captureProgressMs: 0,
      scoreAccumulatorMs: 0
    });
  }
  return nodes;
}

export function updateControlObjectives(state: GameState, deltaMs: number): void {
  const config = gameModePolicyForRules(state.rules).control;
  if (!config || state.phase !== "playing") return;

  for (const node of state.controlNodes) {
    const occupants = state.players.filter(
      (player) => player.alive && player.x === node.x && player.y === node.y
    );

    if (occupants.length !== 1) {
      node.capturingPlayerId = null;
      node.captureProgressMs = 0;
      continue;
    }

    const player = occupants[0];
    if (node.ownerId !== player.id) {
      node.scoreAccumulatorMs = 0;
      if (node.capturingPlayerId !== player.id) {
        node.capturingPlayerId = player.id;
        node.captureProgressMs = 0;
      }
      node.captureProgressMs += deltaMs;
      if (node.captureProgressMs < config.captureMs) continue;

      node.ownerId = player.id;
      node.capturingPlayerId = null;
      node.captureProgressMs = 0;
      node.scoreAccumulatorMs = 0;
      const metrics = metricsForPlayer(state, player.id);
      if (metrics) metrics.nodesCaptured++;
      continue;
    }

    node.capturingPlayerId = null;
    node.captureProgressMs = 0;
    node.scoreAccumulatorMs += deltaMs;
    const points = Math.floor(node.scoreAccumulatorMs / config.pointIntervalMs);
    if (points <= 0) continue;
    node.scoreAccumulatorMs -= points * config.pointIntervalMs;
    const metrics = metricsForPlayer(state, player.id);
    if (metrics) metrics.objectivePoints += points;
  }
}
