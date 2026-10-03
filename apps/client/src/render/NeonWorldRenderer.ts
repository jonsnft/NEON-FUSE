import { GameObjects, Scene } from "phaser";
import {
  cosmeticById,
  indexOf,
  type GameState,
  type PlayerPresentation
} from "@neon-fuse/shared";
import { MOTION, NEON } from "./neonTheme";

export const TILE = 48;

interface VisualPlayer {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const avatarColor = (presentation?: PlayerPresentation): number => {
  const token = presentation ? cosmeticById(presentation.loadout.avatar)?.visualToken : undefined;
  if (token === "lime") return NEON.acid;
  if (token === "ghost") return NEON.violet;
  return NEON.cyan;
};

const coreToken = (presentation?: PlayerPresentation): string | undefined =>
  presentation ? cosmeticById(presentation.loadout.core)?.visualToken : undefined;

export class NeonWorldRenderer {
  private readonly graphics: GameObjects.Graphics;
  private state: GameState | null = null;
  private selfId?: string;
  private presentations: Record<string, PlayerPresentation> = {};
  private readonly players = new Map<string, VisualPlayer>();

  constructor(private readonly scene: Scene) {
    this.graphics = scene.add.graphics();
  }

  setState(
    state: GameState,
    selfId?: string,
    presentations: Record<string, PlayerPresentation> = {}
  ): void {
    this.state = state;
    this.selfId = selfId;
    this.presentations = presentations;

    const presentIds = new Set(state.players.map((player) => player.id));
    for (const id of this.players.keys()) {
      if (!presentIds.has(id)) this.players.delete(id);
    }

    for (const player of state.players) {
      const targetX = player.x * TILE + TILE / 2;
      const targetY = player.y * TILE + TILE / 2;
      const visual = this.players.get(player.id);
      if (visual) {
        visual.targetX = targetX;
        visual.targetY = targetY;
      } else {
        this.players.set(player.id, {
          x: targetX,
          y: targetY,
          targetX,
          targetY
        });
      }
    }
  }

  clearState(): void {
    this.state = null;
    this.players.clear();
  }

  destroy(): void {
    this.graphics.destroy();
    this.players.clear();
    this.state = null;
  }

  render(timeMs: number, deltaMs: number): void {
    const g = this.graphics;
    g.clear();
    this.drawBackdrop(g, timeMs);

    const state = this.state;
    if (!state) return;

    this.drawArena(g, state, timeMs);
    this.drawPickups(g, state, timeMs);
    this.drawCores(g, state, timeMs);
    this.drawBlasts(g, state, timeMs);
    this.drawPlayers(g, state, deltaMs, timeMs);
  }

  private drawBackdrop(g: GameObjects.Graphics, timeMs: number): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const ambient = 0.5 + Math.sin(timeMs / MOTION.ambientPulseMs) * 0.08;

    g.fillStyle(NEON.background, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(NEON.backgroundLift, 0.32 * ambient);
    g.fillRect(0, 0, width, height);

    const scanOffset = (timeMs * MOTION.scanSpeedPxPerSecond / 1000) % 8;
    g.lineStyle(1, NEON.cyan, 0.022);
    for (let y = -8 + scanOffset; y < height; y += 8) {
      g.lineBetween(0, y, width, y);
    }
  }

  private drawArena(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    const gridPulse = 0.55 + Math.sin(timeMs / 900) * 0.08;

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = state.tiles[indexOf(state, x, y)];
        const px = x * TILE;
        const py = y * TILE;

        if (tile === "hard") {
          g.fillStyle(NEON.hard, 1);
          g.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          g.lineStyle(1, NEON.hardEdge, 0.58);
          g.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
          g.lineStyle(1, NEON.cyan, 0.08);
          g.lineBetween(px + 7, py + 8, px + TILE - 7, py + 8);
          continue;
        }

        if (tile === "soft") {
          g.fillStyle(NEON.softEdge, 0.06);
          g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
          g.fillStyle(NEON.soft, 1);
          g.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
          g.lineStyle(1, NEON.softEdge, 0.42);
          g.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
          g.lineStyle(1, NEON.softEdge, 0.12);
          g.lineBetween(px + 9, py + 12, px + TILE - 9, py + TILE - 12);
          continue;
        }

        g.fillStyle(NEON.floor, 1);
        g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        g.lineStyle(1, NEON.floorGrid, gridPulse);
        g.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        g.lineStyle(1, NEON.cyan, 0.035);
        g.lineBetween(px + TILE / 2, py + 8, px + TILE / 2, py + TILE - 8);
        g.lineBetween(px + 8, py + TILE / 2, px + TILE - 8, py + TILE / 2);
      }
    }
  }

  private drawPickups(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    for (const pickup of state.pickups) {
      if (!pickup.revealed) continue;
      const cx = pickup.x * TILE + TILE / 2;
      const cy = pickup.y * TILE + TILE / 2;
      const color = pickup.kind === "range"
        ? NEON.magenta
        : pickup.kind === "capacity"
          ? NEON.cyan
          : NEON.amber;
      const pulse = 1 + Math.sin(timeMs / 180 + pickup.x * 0.7 + pickup.y) * 0.12;
      const radius = 8 * pulse;

      g.fillStyle(color, 0.07);
      g.fillCircle(cx, cy, 16 * pulse);
      g.lineStyle(2, color, 0.85);
      g.strokeCircle(cx, cy, radius + 3);
      g.fillStyle(NEON.white, 0.92);
      g.fillCircle(cx, cy, Math.max(2.5, radius * 0.34));
    }
  }

  private drawCores(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    for (const core of state.cores) {
      const presentation = this.presentations[core.ownerId];
      const token = coreToken(presentation);
      const cx = core.x * TILE + TILE / 2;
      const cy = core.y * TILE + TILE / 2;
      const phase = timeMs / MOTION.corePulseMs + core.x * 0.4 + core.y * 0.2;
      const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      const halo = 17 + pulse * 5;

      g.fillStyle(NEON.magenta, 0.055 + pulse * 0.035);
      g.fillCircle(cx, cy, halo + 9);
      g.lineStyle(2, NEON.magenta, 0.55 + pulse * 0.3);
      g.strokeCircle(cx, cy, halo);
      g.lineStyle(2, NEON.cyan, 0.7);
      g.strokeCircle(cx, cy, 10 + pulse * 2);

      if (token === "floppy") {
        g.fillStyle(NEON.magenta, 0.95);
        g.fillRect(cx - 10, cy - 11, 20, 22);
        g.fillStyle(NEON.background, 1);
        g.fillRect(cx - 5, cy - 7, 10, 5);
      } else {
        g.fillStyle(NEON.white, 0.95);
        g.fillCircle(cx, cy, 5 + pulse * 1.5);
      }
    }
  }

  private drawBlasts(g: GameObjects.Graphics, state: GameState, timeMs: number): void {
    const pulse = 0.82 + Math.sin(timeMs / 34) * 0.12;

    for (const blast of state.blasts) {
      const px = blast.x * TILE;
      const py = blast.y * TILE;

      g.fillStyle(NEON.cyan, 0.08);
      g.fillRect(px - 4, py - 4, TILE + 8, TILE + 8);
      g.fillStyle(NEON.magenta, 0.18);
      g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      g.fillStyle(NEON.cyan, 0.52 * pulse);
      g.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
      g.fillStyle(NEON.white, 0.92);
      g.fillRect(px + 16, py + 16, TILE - 32, TILE - 32);
    }
  }

  private drawPlayers(
    g: GameObjects.Graphics,
    state: GameState,
    deltaMs: number,
    timeMs: number
  ): void {
    const follow = 1 - Math.exp(-Math.max(0, deltaMs) / MOTION.playerFollowMs);

    for (const player of state.players) {
      const visual = this.players.get(player.id);
      if (!visual) continue;

      visual.targetX = player.x * TILE + TILE / 2;
      visual.targetY = player.y * TILE + TILE / 2;
      visual.x += (visual.targetX - visual.x) * follow;
      visual.y += (visual.targetY - visual.y) * follow;

      if (!player.alive) continue;

      const presentation = this.presentations[player.id];
      const baseColor = avatarColor(presentation);
      const isSelf = player.id === this.selfId;
      const bodyColor = isSelf ? NEON.white : baseColor;
      const pulse = 0.5 + Math.sin(timeMs / 240 + visual.x * 0.01) * 0.5;
      const size = 24;

      g.fillStyle(baseColor, 0.05 + pulse * 0.025);
      g.fillRect(visual.x - 19, visual.y - 19, 38, 38);
      g.lineStyle(2, baseColor, 0.28 + pulse * 0.22);
      g.strokeRect(visual.x - 16, visual.y - 16, 32, 32);
      g.fillStyle(bodyColor, 0.94);
      g.fillRect(visual.x - size / 2, visual.y - size / 2, size, size);
      g.fillStyle(NEON.background, 0.82);
      g.fillRect(visual.x - 4, visual.y - 4, 8, 8);
      g.fillStyle(baseColor, 1);
      g.fillRect(visual.x - 2, visual.y - 2, 4, 4);

      if (isSelf) {
        g.lineStyle(2, NEON.cyan, 0.82);
        g.strokeRect(visual.x - 15, visual.y - 15, 30, 30);
      }

      if (cosmeticById(presentation?.loadout.avatar ?? "")?.visualToken === "ghost") {
        g.lineStyle(1, NEON.violet, 0.52);
        g.strokeRect(visual.x - 20, visual.y - 20, 40, 40);
      }
    }
  }
}
