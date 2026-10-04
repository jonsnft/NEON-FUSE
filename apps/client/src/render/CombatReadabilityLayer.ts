import { GameObjects, Scene } from "phaser";
import {
  gameModePolicyForRules,
  suddenDeathEnabledForRules,
  suddenDeathOrder,
  type GameState,
  type SimBlast
} from "@neon-fuse/shared";
import { NEON } from "./neonTheme";
import { getVisualPreferences } from "./visualSettings";

const TILE = 48;
const PRESSURE_WARNING_MS = 8_000;
const PRESSURE_LOOKAHEAD = 4;

const cellKey = (x: number, y: number): string => `${x},${y}`;
const sourceKey = (blast: SimBlast): string => blast.sourceCoreId ?? `${blast.ownerId ?? "unknown"}:${blast.x},${blast.y}`;

export class CombatReadabilityLayer {
  private readonly graphics: GameObjects.Graphics;
  private state: GameState | null = null;

  constructor(private readonly scene: Scene) {
    this.graphics = scene.add.graphics().setDepth(6);
  }

  setState(state: GameState): void {
    this.state = state;
  }

  clearState(): void {
    this.state = null;
    this.graphics.clear();
  }

  render(timeMs: number): void {
    const g = this.graphics;
    g.clear();
    if (!this.state) return;

    this.drawControlNodes(g, this.state, timeMs);
    this.drawBlastGeometry(g, this.state);
    this.drawPressureTelegraph(g, this.state, timeMs);
    this.drawRespawnShields(g, this.state, timeMs);
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private drawControlNodes(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    if (!state.controlNodes.length) return;
    const config = gameModePolicyForRules(state.rules).control;
    if (!config) return;
    const prefs = getVisualPreferences();

    for (const node of state.controlNodes) {
      const cx = node.x * TILE + TILE / 2;
      const cy = node.y * TILE + TILE / 2;
      const occupied = state.players.some(
        (player) => player.alive && player.x === node.x && player.y === node.y
      );
      const contested = state.players.filter(
        (player) => player.alive && player.x === node.x && player.y === node.y
      ).length > 1;
      const color = contested
        ? NEON.danger
        : node.capturingPlayerId
          ? NEON.magenta
          : node.ownerId
            ? NEON.acid
            : NEON.cyan;
      const pulse = prefs.reducedMotion ? 0 : Math.sin(timeMs / 150 + node.x) * 2;

      g.fillStyle(color, node.ownerId ? 0.08 : 0.045);
      g.fillCircle(cx, cy, 19 + pulse);
      g.lineStyle(node.ownerId ? 3 : 2, color, 0.9);
      g.strokeCircle(cx, cy, 15 + pulse * 0.35);
      g.lineStyle(1, NEON.white, 0.5);
      g.strokeRect(cx - 9, cy - 9, 18, 18);
      g.lineBetween(cx - 6, cy, cx + 6, cy);
      g.lineBetween(cx, cy - 6, cx, cy + 6);

      if (node.capturingPlayerId) {
        const progress = Math.max(0, Math.min(1, node.captureProgressMs / config.captureMs));
        const width = 30;
        g.fillStyle(NEON.background, 0.9);
        g.fillRect(cx - width / 2, cy + 18, width, 4);
        g.fillStyle(color, 0.95);
        g.fillRect(cx - width / 2, cy + 18, width * progress, 4);
      } else if (node.ownerId && occupied && !contested) {
        g.fillStyle(color, 0.8);
        g.fillRect(cx - 11, cy + 18, 22, 2);
      }
    }
  }

  private drawBlastGeometry(g: GameObjects.Graphics, state: GameState): void {
    const bySource = new Map<string, Set<string>>();
    for (const blast of state.blasts) {
      const key = sourceKey(blast);
      const cells = bySource.get(key) ?? new Set<string>();
      cells.add(cellKey(blast.x, blast.y));
      bySource.set(key, cells);
    }

    for (const blast of state.blasts) {
      const cells = bySource.get(sourceKey(blast));
      if (!cells) continue;
      const cx = blast.x * TILE + TILE / 2;
      const cy = blast.y * TILE + TILE / 2;
      const neighbors = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
      ].filter(({ dx, dy }) => cells.has(cellKey(blast.x + dx, blast.y + dy)));

      g.lineStyle(5, NEON.white, 0.86);
      for (const { dx, dy } of neighbors) {
        g.lineBetween(cx, cy, cx + dx * (TILE / 2 - 5), cy + dy * (TILE / 2 - 5));
      }

      g.fillStyle(NEON.cyan, 0.82);
      g.fillRect(cx - 5, cy - 5, 10, 10);
      g.lineStyle(2, NEON.magenta, 0.92);
      g.strokeRect(cx - 8, cy - 8, 16, 16);

      if (neighbors.length === 1) {
        const { dx, dy } = neighbors[0];
        const ox = -dx;
        const oy = -dy;
        const tipX = cx + ox * 14;
        const tipY = cy + oy * 14;
        g.fillStyle(NEON.white, 0.95);
        if (ox !== 0) {
          g.fillTriangle(tipX + ox * 7, tipY, tipX - ox * 4, tipY - 6, tipX - ox * 4, tipY + 6);
        } else {
          g.fillTriangle(tipX, tipY + oy * 7, tipX - 6, tipY - oy * 4, tipX + 6, tipY - oy * 4);
        }
      }
    }
  }

  private drawPressureTelegraph(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    if (!suddenDeathEnabledForRules(state.rules)) return;
    const untilPressureMs = state.suddenDeathStartMs - state.elapsedMs;
    if (untilPressureMs > PRESSURE_WARNING_MS) return;

    const order = suddenDeathOrder(state.width, state.height);
    const start = state.elapsedMs >= state.suddenDeathStartMs ? state.suddenDeathCursor : 0;
    const next = order.slice(start, start + PRESSURE_LOOKAHEAD);
    if (!next.length) return;

    const prefs = getVisualPreferences();
    const pulse = prefs.reducedMotion ? 0.72 : 0.55 + Math.sin(timeMs / 110) * 0.18;
    next.forEach((cell, index) => {
      const px = cell.x * TILE;
      const py = cell.y * TILE;
      const alpha = Math.max(0.22, pulse - index * 0.09);
      g.fillStyle(NEON.danger, 0.08 + alpha * 0.08);
      g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      g.lineStyle(index === 0 ? 3 : 1, index === 0 ? NEON.white : NEON.danger, alpha);
      g.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
      g.lineBetween(px + 8, py + 8, px + TILE - 8, py + TILE - 8);
      g.lineBetween(px + TILE - 8, py + 8, px + 8, py + TILE - 8);
    });
  }

  private drawRespawnShields(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    const prefs = getVisualPreferences();
    for (const player of state.players) {
      if (!player.alive || player.invulnerableUntilMs <= state.elapsedMs) continue;
      const cx = player.x * TILE + TILE / 2;
      const cy = player.y * TILE + TILE / 2;
      const phase = prefs.reducedMotion ? 0 : Math.sin(timeMs / 95) * 2;
      g.lineStyle(2, NEON.acid, 0.9);
      g.strokeCircle(cx, cy, 19 + phase);
      g.lineStyle(1, NEON.white, 0.7);
      g.strokeCircle(cx, cy, 14);
    }
  }
}
