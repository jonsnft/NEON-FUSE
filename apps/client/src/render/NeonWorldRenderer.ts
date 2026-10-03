import { GameObjects, Scene } from "phaser";
import {
  cosmeticById,
  indexOf,
  type GameState,
  type PlayerPresentation
} from "@neon-fuse/shared";
import { MOTION, NEON } from "./neonTheme";
import { getVisualPreferences } from "./visualSettings";

export const TILE = 48;
const CAMERA_SHAKE_COOLDOWN_MS = 180;

interface VisualPlayer {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  lastTrailAt: number;
}

type FxKind = "trail" | "core" | "blast" | "block" | "pickup";

interface TransientFx {
  kind: FxKind;
  x: number;
  y: number;
  color: number;
  startedAt: number;
  durationMs: number;
  seed: number;
}

interface PresentationBaseline {
  cores: Set<string>;
  blasts: Set<string>;
  pickups: Map<string, { x: number; y: number; kind: string }>;
  tiles: GameState["tiles"];
}

const avatarColor = (presentation?: PlayerPresentation): number => {
  const token = presentation ? cosmeticById(presentation.loadout.avatar)?.visualToken : undefined;
  if (token === "lime") return NEON.acid;
  if (token === "ghost") return NEON.violet;
  return NEON.cyan;
};

const coreToken = (presentation?: PlayerPresentation): string | undefined =>
  presentation ? cosmeticById(presentation.loadout.core)?.visualToken : undefined;

const cellKey = (x: number, y: number): string => `${x}:${y}`;
const coreKey = (ownerId: string, x: number, y: number): string => `${ownerId}:${x}:${y}`;

const seededUnit = (seed: number): number => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export class NeonWorldRenderer {
  private readonly graphics: GameObjects.Graphics;
  private state: GameState | null = null;
  private selfId?: string;
  private presentations: Record<string, PlayerPresentation> = {};
  private readonly players = new Map<string, VisualPlayer>();
  private readonly transientFx: TransientFx[] = [];
  private baseline: PresentationBaseline | null = null;
  private nextSeed = 1;
  private lastCameraShakeAt = -Infinity;

  constructor(private readonly scene: Scene) {
    this.graphics = scene.add.graphics();
  }

  setState(
    state: GameState,
    selfId?: string,
    presentations: Record<string, PlayerPresentation> = {}
  ): void {
    const now = this.scene.time.now;
    if (this.baseline) this.deriveSnapshotFx(this.baseline, state, now);

    this.state = state;
    this.selfId = selfId;
    this.presentations = presentations;
    this.baseline = this.captureBaseline(state);

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
          targetY,
          lastTrailAt: now
        });
      }
    }
  }

  clearState(): void {
    this.state = null;
    this.players.clear();
    this.transientFx.length = 0;
    this.baseline = null;
  }

  destroy(): void {
    this.graphics.destroy();
    this.players.clear();
    this.transientFx.length = 0;
    this.state = null;
    this.baseline = null;
  }

  render(timeMs: number, deltaMs: number): void {
    const prefs = getVisualPreferences();
    const motionTime = prefs.ambientMotionEnabled ? timeMs : 0;
    const g = this.graphics;
    g.clear();
    this.drawBackdrop(g, motionTime);

    const state = this.state;
    if (!state) return;

    this.pruneFx(timeMs);
    this.drawArena(g, state, motionTime);
    this.drawTransientFx(g, timeMs, "block");
    this.drawPickups(g, state, motionTime);
    this.drawTransientFx(g, timeMs, "pickup");
    this.drawCores(g, state, motionTime);
    this.drawTransientFx(g, timeMs, "core");
    this.drawBlasts(g, state, motionTime);
    this.drawTransientFx(g, timeMs, "blast");
    this.drawPlayers(g, state, deltaMs, motionTime, timeMs);
    this.drawTransientFx(g, timeMs, "trail");
  }

  private captureBaseline(state: GameState): PresentationBaseline {
    return {
      cores: new Set(state.cores.map((core) => coreKey(core.ownerId, core.x, core.y))),
      blasts: new Set(state.blasts.map((blast) => cellKey(blast.x, blast.y))),
      pickups: new Map(
        state.pickups
          .filter((pickup) => pickup.revealed)
          .map((pickup) => [cellKey(pickup.x, pickup.y), { x: pickup.x, y: pickup.y, kind: pickup.kind }])
      ),
      tiles: [...state.tiles]
    };
  }

  private deriveSnapshotFx(previous: PresentationBaseline, state: GameState, now: number): void {
    for (const core of state.cores) {
      if (!previous.cores.has(coreKey(core.ownerId, core.x, core.y))) {
        this.emitFx("core", core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, NEON.magenta, now, 360);
      }
    }

    let newBlastCells = 0;
    for (const blast of state.blasts) {
      const key = cellKey(blast.x, blast.y);
      if (!previous.blasts.has(key)) {
        newBlastCells += 1;
        this.emitFx("blast", blast.x * TILE + TILE / 2, blast.y * TILE + TILE / 2, NEON.cyan, now, 300);
      }
    }

    const prefs = getVisualPreferences();
    if (
      prefs.cameraShakeEnabled &&
      newBlastCells > 0 &&
      now - this.lastCameraShakeAt >= CAMERA_SHAKE_COOLDOWN_MS
    ) {
      this.lastCameraShakeAt = now;
      this.scene.cameras.main.shake(85, Math.min(0.0032, 0.0015 + newBlastCells * 0.00022));
    }

    const maxTiles = Math.min(previous.tiles.length, state.tiles.length);
    for (let i = 0; i < maxTiles; i++) {
      if (previous.tiles[i] === "soft" && state.tiles[i] === "floor") {
        const x = i % state.width;
        const y = Math.floor(i / state.width);
        this.emitFx("block", x * TILE + TILE / 2, y * TILE + TILE / 2, NEON.magenta, now, 440);
      }
    }

    const nextPickupKeys = new Set(
      state.pickups.filter((pickup) => pickup.revealed).map((pickup) => cellKey(pickup.x, pickup.y))
    );
    for (const [key, pickup] of previous.pickups) {
      if (nextPickupKeys.has(key)) continue;
      const occupiedByPlayer = state.players.some(
        (player) => player.alive && player.x === pickup.x && player.y === pickup.y
      );
      if (!occupiedByPlayer) continue;
      const color = pickup.kind === "range"
        ? NEON.magenta
        : pickup.kind === "capacity"
          ? NEON.cyan
          : NEON.amber;
      this.emitFx("pickup", pickup.x * TILE + TILE / 2, pickup.y * TILE + TILE / 2, color, now, 420);
    }
  }

  private emitFx(
    kind: FxKind,
    x: number,
    y: number,
    color: number,
    startedAt: number,
    durationMs: number
  ): void {
    const prefs = getVisualPreferences();
    if (kind === "trail" && !prefs.trailsEnabled) return;

    this.transientFx.push({
      kind,
      x,
      y,
      color,
      startedAt,
      durationMs,
      seed: this.nextSeed++
    });
    if (this.transientFx.length > prefs.transientFxCap) {
      this.transientFx.splice(0, this.transientFx.length - prefs.transientFxCap);
    }
  }

  private pruneFx(timeMs: number): void {
    let write = 0;
    for (let read = 0; read < this.transientFx.length; read++) {
      const fx = this.transientFx[read];
      if (timeMs - fx.startedAt <= fx.durationMs) {
        this.transientFx[write++] = fx;
      }
    }
    this.transientFx.length = write;
  }

  private drawTransientFx(g: GameObjects.Graphics, timeMs: number, kind: FxKind): void {
    for (const fx of this.transientFx) {
      if (fx.kind !== kind) continue;
      const progress = Math.max(0, Math.min(1, (timeMs - fx.startedAt) / fx.durationMs));
      const life = 1 - progress;

      if (kind === "trail") {
        g.fillStyle(fx.color, 0.13 * life);
        g.fillCircle(fx.x, fx.y, 7 + progress * 7);
        g.lineStyle(1, fx.color, 0.32 * life);
        g.strokeCircle(fx.x, fx.y, 4 + progress * 10);
        continue;
      }

      if (kind === "core") {
        g.lineStyle(3, fx.color, 0.8 * life);
        g.strokeCircle(fx.x, fx.y, 8 + progress * 30);
        g.lineStyle(1, NEON.white, 0.65 * life);
        g.strokeCircle(fx.x, fx.y, 3 + progress * 18);
        this.drawRadialSparks(g, fx, progress, life, 6, 8, 25);
        continue;
      }

      if (kind === "blast") {
        g.fillStyle(NEON.white, 0.14 * life);
        g.fillCircle(fx.x, fx.y, 10 + progress * 20);
        this.drawRadialSparks(g, fx, progress, life, 8, 7, 34);
        continue;
      }

      if (kind === "block") {
        for (let i = 0; i < 7; i++) {
          const angle = seededUnit(fx.seed * 13 + i) * Math.PI * 2;
          const radius = 6 + progress * (14 + seededUnit(fx.seed * 19 + i) * 18);
          const size = 5 * life + 1;
          const x = fx.x + Math.cos(angle) * radius;
          const y = fx.y + Math.sin(angle) * radius + progress * progress * 8;
          g.fillStyle(i % 2 === 0 ? fx.color : NEON.cyan, 0.48 * life);
          g.fillRect(x - size / 2, y - size / 2, size, size);
        }
        continue;
      }

      if (kind === "pickup") {
        g.lineStyle(2, fx.color, 0.75 * life);
        g.strokeCircle(fx.x, fx.y, 5 + progress * 25);
        g.lineStyle(1, NEON.white, 0.58 * life);
        g.strokeCircle(fx.x, fx.y, 3 + progress * 14);
        this.drawRadialSparks(g, fx, progress, life, 5, 5, 22);
      }
    }
  }

  private drawRadialSparks(
    g: GameObjects.Graphics,
    fx: TransientFx,
    progress: number,
    life: number,
    count: number,
    minRadius: number,
    travel: number
  ): void {
    const prefs = getVisualPreferences();
    const actualCount = prefs.quality === "low" ? Math.ceil(count / 2) : count;
    for (let i = 0; i < actualCount; i++) {
      const angle = seededUnit(fx.seed * 31 + i) * Math.PI * 2;
      const radius = minRadius + progress * (travel * (0.7 + seededUnit(fx.seed * 43 + i) * 0.5));
      const x = fx.x + Math.cos(angle) * radius;
      const y = fx.y + Math.sin(angle) * radius;
      const r = 1.2 + seededUnit(fx.seed * 59 + i) * 1.8;
      g.fillStyle(i % 3 === 0 ? NEON.white : fx.color, 0.72 * life);
      g.fillCircle(x, y, r);
    }
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
    motionTimeMs: number,
    realTimeMs: number
  ): void {
    const follow = 1 - Math.exp(-Math.max(0, deltaMs) / MOTION.playerFollowMs);
    const prefs = getVisualPreferences();

    for (const player of state.players) {
      const visual = this.players.get(player.id);
      if (!visual) continue;

      visual.targetX = player.x * TILE + TILE / 2;
      visual.targetY = player.y * TILE + TILE / 2;
      const previousX = visual.x;
      const previousY = visual.y;
      visual.x += (visual.targetX - visual.x) * follow;
      visual.y += (visual.targetY - visual.y) * follow;

      if (player.alive && prefs.trailsEnabled) {
        const moved = Math.hypot(visual.x - previousX, visual.y - previousY);
        const trailInterval = prefs.quality === "high" ? 36 : 64;
        if (moved > 0.7 && realTimeMs - visual.lastTrailAt >= trailInterval) {
          visual.lastTrailAt = realTimeMs;
          this.emitFx(
            "trail",
            previousX,
            previousY,
            avatarColor(this.presentations[player.id]),
            realTimeMs,
            230
          );
        }
      }

      if (!player.alive) continue;

      const presentation = this.presentations[player.id];
      const baseColor = avatarColor(presentation);
      const isSelf = player.id === this.selfId;
      const bodyColor = isSelf ? NEON.white : baseColor;
      const pulse = 0.5 + Math.sin(motionTimeMs / 240 + visual.x * 0.01) * 0.5;
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
