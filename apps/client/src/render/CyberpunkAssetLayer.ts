import { GameObjects, Scene } from "phaser";
import {
  cosmeticById,
  indexOf,
  type GameState,
  type PlayerPresentation
} from "@neon-fuse/shared";
import { NEON } from "./neonTheme";

const TILE = 48;

interface VisualPlayer {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface MaterialTheme {
  primary: number;
  secondary: number;
  accent: number;
  hard: number;
  soft: number;
  floor: number;
}

const THEMES: Record<string, MaterialTheme> = {
  "grid-zero": {
    primary: 0x53f3ff,
    secondary: 0x175e75,
    accent: 0xffffff,
    hard: 0x0b1820,
    soft: 0x18212c,
    floor: 0x050b11
  },
  "data-cross": {
    primary: 0xff4fd8,
    secondary: 0x742a78,
    accent: 0x53f3ff,
    hard: 0x17101f,
    soft: 0x241527,
    floor: 0x080710
  },
  switchyard: {
    primary: 0xffc857,
    secondary: 0x7f5220,
    accent: 0x53f3ff,
    hard: 0x1a1711,
    soft: 0x282116,
    floor: 0x0b0a07
  }
};

const themeFor = (mapId: string): MaterialTheme => THEMES[mapId] ?? THEMES["grid-zero"];

const avatarColor = (presentation?: PlayerPresentation): number => {
  const token = presentation ? cosmeticById(presentation.loadout.avatar)?.visualToken : undefined;
  if (token === "lime") return NEON.acid;
  if (token === "ghost") return NEON.violet;
  return NEON.cyan;
};

export class CyberpunkAssetLayer {
  private readonly graphics: GameObjects.Graphics;
  private state: GameState | null = null;
  private selfId?: string;
  private presentations: Record<string, PlayerPresentation> = {};
  private readonly players = new Map<string, VisualPlayer>();

  constructor(private readonly scene: Scene) {
    this.graphics = scene.add.graphics().setDepth(1).setAlpha(0.88);
  }

  setState(
    state: GameState,
    selfId?: string,
    presentations: Record<string, PlayerPresentation> = {}
  ): void {
    this.state = state;
    this.selfId = selfId;
    this.presentations = presentations;

    const currentIds = new Set(state.players.map((player) => player.id));
    for (const id of this.players.keys()) {
      if (!currentIds.has(id)) this.players.delete(id);
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
    this.graphics.clear();
  }

  destroy(): void {
    this.graphics.destroy();
    this.players.clear();
    this.state = null;
  }

  render(timeMs: number, deltaMs: number): void {
    const state = this.state;
    const g = this.graphics;
    g.clear();
    if (!state) return;

    const theme = themeFor(state.mapId);
    this.drawTiles(g, state, theme, timeMs);
    this.drawPickups(g, state, theme, timeMs);
    this.drawCores(g, state, theme, timeMs);
    this.drawPlayers(g, state, theme, deltaMs, timeMs);
  }

  private drawTiles(
    g: GameObjects.Graphics,
    state: GameState,
    theme: MaterialTheme,
    timeMs: number
  ): void {
    const pulse = 0.5 + Math.sin(timeMs / 820) * 0.5;

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = state.tiles[indexOf(state, x, y)];
        const px = x * TILE;
        const py = y * TILE;

        if (tile === "floor") {
          g.fillStyle(theme.floor, 0.58);
          g.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
          g.lineStyle(1, theme.secondary, 0.24);
          g.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
          this.drawFloorMotif(g, state.mapId, px, py, theme, pulse, x, y);
          continue;
        }

        if (tile === "hard") {
          g.fillStyle(theme.hard, 0.82);
          g.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
          g.lineStyle(2, theme.primary, 0.38);
          g.strokeRect(px + 7, py + 7, TILE - 14, TILE - 14);
          g.lineStyle(1, theme.secondary, 0.72);
          g.lineBetween(px + 11, py + 13, px + TILE - 11, py + 13);
          g.lineBetween(px + 11, py + TILE - 13, px + TILE - 11, py + TILE - 13);
          g.fillStyle(theme.accent, 0.55);
          g.fillRect(px + 10, py + 10, 3, 3);
          g.fillRect(px + TILE - 13, py + TILE - 13, 3, 3);
          this.drawHardMotif(g, state.mapId, px, py, theme);
          continue;
        }

        g.fillStyle(theme.soft, 0.78);
        g.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
        g.lineStyle(1, theme.primary, 0.48);
        g.strokeRect(px + 7, py + 7, TILE - 14, TILE - 14);
        g.lineStyle(1, theme.secondary, 0.8);
        g.lineBetween(px + 10, py + 10, px + TILE - 10, py + TILE - 10);
        g.lineBetween(px + TILE - 10, py + 10, px + 10, py + TILE - 10);
        g.fillStyle(theme.primary, 0.12 + pulse * 0.08);
        g.fillRect(px + 12, py + 12, TILE - 24, TILE - 24);
        this.drawSoftMotif(g, state.mapId, px, py, theme);
      }
    }
  }

  private drawFloorMotif(
    g: GameObjects.Graphics,
    mapId: string,
    px: number,
    py: number,
    theme: MaterialTheme,
    pulse: number,
    x: number,
    y: number
  ): void {
    if (mapId === "data-cross") {
      g.lineStyle(1, theme.primary, 0.12 + pulse * 0.08);
      g.lineBetween(px + 8, py + TILE / 2, px + TILE - 8, py + TILE / 2);
      g.lineBetween(px + TILE / 2, py + 8, px + TILE / 2, py + TILE - 8);
      g.fillStyle(theme.accent, 0.34);
      g.fillRect(px + TILE / 2 - 2, py + TILE / 2 - 2, 4, 4);
      return;
    }

    if (mapId === "switchyard") {
      g.lineStyle(2, theme.primary, 0.18);
      const offset = (x + y) % 2 === 0 ? 12 : 18;
      g.lineBetween(px + 8, py + offset, px + TILE - 8, py + offset);
      g.lineStyle(1, theme.accent, 0.16);
      g.lineBetween(px + 12, py + TILE - 12, px + TILE - 12, py + 12);
      return;
    }

    g.lineStyle(1, theme.primary, 0.12 + pulse * 0.06);
    g.strokeCircle(px + TILE / 2, py + TILE / 2, 9);
    g.lineBetween(px + TILE / 2, py + 8, px + TILE / 2, py + 15);
    g.lineBetween(px + 8, py + TILE / 2, px + 15, py + TILE / 2);
  }

  private drawHardMotif(
    g: GameObjects.Graphics,
    mapId: string,
    px: number,
    py: number,
    theme: MaterialTheme
  ): void {
    if (mapId === "switchyard") {
      g.lineStyle(2, theme.primary, 0.5);
      g.lineBetween(px + 14, py + 19, px + TILE - 14, py + 19);
      g.lineBetween(px + 14, py + 27, px + TILE - 14, py + 27);
      return;
    }
    if (mapId === "data-cross") {
      g.fillStyle(theme.primary, 0.3);
      g.fillRect(px + 20, py + 14, 8, 20);
      g.fillStyle(theme.accent, 0.22);
      g.fillRect(px + 14, py + 20, 20, 8);
      return;
    }
    g.lineStyle(1, theme.primary, 0.32);
    g.strokeCircle(px + TILE / 2, py + TILE / 2, 8);
    g.fillStyle(theme.primary, 0.28);
    g.fillCircle(px + TILE / 2, py + TILE / 2, 2.5);
  }

  private drawSoftMotif(
    g: GameObjects.Graphics,
    mapId: string,
    px: number,
    py: number,
    theme: MaterialTheme
  ): void {
    if (mapId === "switchyard") {
      g.lineStyle(2, theme.primary, 0.5);
      for (let i = 0; i < 3; i++) {
        const y = py + 15 + i * 7;
        g.lineBetween(px + 13, y, px + TILE - 13, y);
      }
      return;
    }
    if (mapId === "data-cross") {
      g.lineStyle(1, theme.primary, 0.54);
      g.strokeCircle(px + TILE / 2, py + TILE / 2, 10);
      g.fillStyle(theme.accent, 0.4);
      g.fillRect(px + 22, py + 13, 4, 22);
      return;
    }
    g.lineStyle(1, theme.primary, 0.5);
    g.strokeRect(px + 14, py + 14, TILE - 28, TILE - 28);
    g.fillStyle(theme.accent, 0.3);
    g.fillRect(px + 21, py + 21, 6, 6);
  }

  private drawPickups(
    g: GameObjects.Graphics,
    state: GameState,
    theme: MaterialTheme,
    timeMs: number
  ): void {
    for (const pickup of state.pickups) {
      if (!pickup.revealed) continue;
      const cx = pickup.x * TILE + TILE / 2;
      const cy = pickup.y * TILE + TILE / 2;
      const pulse = 1 + Math.sin(timeMs / 190 + pickup.x + pickup.y) * 0.08;
      const color = pickup.kind === "range"
        ? 0xff4fd8
        : pickup.kind === "capacity"
          ? 0x53f3ff
          : 0xffc857;

      g.fillStyle(0x02060a, 0.86);
      g.fillCircle(cx, cy, 12 * pulse);
      g.lineStyle(2, color, 0.88);
      g.strokeCircle(cx, cy, 10 * pulse);

      if (pickup.kind === "range") {
        g.lineStyle(2, color, 0.95);
        g.lineBetween(cx - 7, cy, cx + 7, cy);
        g.lineBetween(cx, cy - 7, cx, cy + 7);
        g.fillStyle(theme.accent, 0.9);
        g.fillCircle(cx, cy, 2.5);
      } else if (pickup.kind === "capacity") {
        g.lineStyle(2, color, 0.95);
        g.strokeRect(cx - 6, cy - 6, 12, 12);
        g.fillStyle(theme.accent, 0.88);
        g.fillRect(cx - 2, cy - 2, 4, 4);
      } else {
        g.lineStyle(2, color, 0.95);
        g.lineBetween(cx - 7, cy + 5, cx, cy - 7);
        g.lineBetween(cx, cy - 7, cx + 7, cy + 5);
        g.lineBetween(cx - 7, cy + 5, cx + 7, cy + 5);
      }
    }
  }

  private drawCores(
    g: GameObjects.Graphics,
    state: GameState,
    theme: MaterialTheme,
    timeMs: number
  ): void {
    for (const core of state.cores) {
      const cx = core.x * TILE + TILE / 2;
      const cy = core.y * TILE + TILE / 2;
      const pulse = 0.5 + Math.sin(timeMs / 120 + core.x * 0.6 + core.y) * 0.5;
      g.fillStyle(0x04060a, 0.94);
      g.fillCircle(cx, cy, 13);
      g.lineStyle(3, NEON.magenta, 0.82);
      g.strokeCircle(cx, cy, 12 + pulse * 2);
      g.lineStyle(1, theme.accent, 0.84);
      g.strokeCircle(cx, cy, 7);
      g.fillStyle(NEON.white, 0.94);
      g.fillCircle(cx, cy, 3.5 + pulse);
      g.lineStyle(1, theme.primary, 0.52);
      g.lineBetween(cx - 9, cy, cx - 5, cy);
      g.lineBetween(cx + 5, cy, cx + 9, cy);
      g.lineBetween(cx, cy - 9, cx, cy - 5);
      g.lineBetween(cx, cy + 5, cx, cy + 9);
    }
  }

  private drawPlayers(
    g: GameObjects.Graphics,
    state: GameState,
    theme: MaterialTheme,
    deltaMs: number,
    timeMs: number
  ): void {
    const follow = 1 - Math.exp(-Math.max(0, deltaMs) / 70);

    for (const player of state.players) {
      const visual = this.players.get(player.id);
      if (!visual || !player.alive) continue;

      visual.targetX = player.x * TILE + TILE / 2;
      visual.targetY = player.y * TILE + TILE / 2;
      visual.x += (visual.targetX - visual.x) * follow;
      visual.y += (visual.targetY - visual.y) * follow;

      const color = avatarColor(this.presentations[player.id]);
      const isSelf = player.id === this.selfId;
      const pulse = 0.5 + Math.sin(timeMs / 210 + visual.x * 0.02) * 0.5;
      const x = visual.x;
      const y = visual.y;

      g.fillStyle(0x02060a, 0.92);
      g.fillRect(x - 13, y - 15, 26, 30);
      g.fillStyle(color, 0.78);
      g.fillRect(x - 10, y - 12, 20, 24);
      g.fillStyle(0x0b1118, 0.94);
      g.fillRect(x - 7, y - 8, 14, 11);
      g.fillStyle(color, 0.22 + pulse * 0.15);
      g.fillRect(x - 16, y - 18, 32, 36);

      g.lineStyle(2, color, 0.96);
      g.lineBetween(x - 9, y - 10, x - 13, y - 4);
      g.lineBetween(x + 9, y - 10, x + 13, y - 4);
      g.lineBetween(x - 9, y + 10, x - 12, y + 15);
      g.lineBetween(x + 9, y + 10, x + 12, y + 15);

      g.fillStyle(NEON.white, 0.96);
      g.fillRect(x - 6, y - 6, 12, 3);
      g.fillStyle(theme.primary, 0.9);
      g.fillRect(x - 4, y + 5, 8, 5);
      g.fillStyle(NEON.white, 0.88);
      g.fillCircle(x, y + 7.5, 2.1);

      if (isSelf) {
        g.lineStyle(2, NEON.white, 0.92);
        g.strokeRect(x - 16, y - 18, 32, 36);
        g.lineStyle(1, theme.primary, 0.86);
        g.strokeCircle(x, y, 22 + pulse * 2);
      }

      const token = cosmeticById(this.presentations[player.id]?.loadout.avatar ?? "")?.visualToken;
      if (token === "ghost") {
        g.lineStyle(1, NEON.violet, 0.65);
        g.strokeRect(x - 18, y - 20, 36, 40);
      }
    }
  }
}
