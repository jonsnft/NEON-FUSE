import { GameObjects, Scene } from "phaser";
import {
  cosmeticById,
  indexOf,
  type GameState,
  type PlayerPresentation,
  type SimCore,
  type SimPickup
} from "@neon-fuse/shared";
import { fuseVisual, inferFacing, type Facing } from "./animatedPresentation";
import { getVisualPreferences } from "./visualSettings";
import {
  PRODUCTION_ATLAS_KEY,
  coreFrame,
  corePlacementFrame,
  eliminationFrame,
  pickupFrame,
  playerFrame,
  tileFrame,
  type AvatarVariant
} from "./spriteAtlas";

const TILE = 48;
const PLAYER_COLORS = [
  0x53f3ff,
  0xff4fd8,
  0xe9ff70,
  0xffb84d,
  0x9b7bff,
  0xff6b6b,
  0x6dffb2,
  0xffffff
] as const;

interface PlayerWaypoint {
  x: number;
  y: number;
  facing: Facing;
}

interface PlayerSpriteState {
  image: GameObjects.Image;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: Facing;
  waypoints: PlayerWaypoint[];
  movingUntilMs: number;
  alive: boolean;
  eliminatedAtMs: number | null;
}

interface CoreSpriteState {
  image: GameObjects.Image;
  placedAtMs: number;
}

const avatarVariant = (presentation?: PlayerPresentation): AvatarVariant => {
  const token = presentation ? cosmeticById(presentation.loadout.avatar)?.visualToken : undefined;
  if (token === "lime") return "lime";
  if (token === "ghost") return "ghost";
  return "cyan";
};

const pickupKey = (pickup: SimPickup): string => `${pickup.x}:${pickup.y}:${pickup.kind}`;
const playerColor = (index: number): number => PLAYER_COLORS[index % PLAYER_COLORS.length];
const teamColor = (teamId?: string | null): number | null => {
  if (teamId === "alpha") return 0x53f3ff;
  if (teamId === "beta") return 0xff4fd8;
  return null;
};

const tileDurationMs = (speedTier: number): number => Math.max(82, 150 - speedTier * 14);

const moveToward = (current: number, target: number, distance: number): number => {
  const delta = target - current;
  if (Math.abs(delta) <= distance) return target;
  return current + Math.sign(delta) * distance;
};

export class SpriteAtlasLayer {
  static isAvailable(scene: Scene): boolean {
    return scene.textures.exists(PRODUCTION_ATLAS_KEY);
  }

  private state: GameState | null = null;
  private selfId?: string;
  private presentations: Record<string, PlayerPresentation> = {};
  private readonly tiles: GameObjects.Image[] = [];
  private readonly players = new Map<string, PlayerSpriteState>();
  private readonly cores = new Map<string, CoreSpriteState>();
  private readonly pickups = new Map<string, GameObjects.Image>();
  private readonly selection: GameObjects.Graphics;
  private tileWidth = 0;
  private tileHeight = 0;
  private tileMapId = "";
  private lastTiles: string[] = [];

  constructor(private readonly scene: Scene) {
    this.selection = scene.add.graphics().setDepth(2.6);
  }

  setState(
    state: GameState,
    selfId?: string,
    presentations: Record<string, PlayerPresentation> = {}
  ): void {
    this.state = state;
    this.selfId = selfId;
    this.presentations = presentations;
    this.syncTiles(state);
    this.syncPlayers(state);
    this.syncCores(state);
    this.syncPickups(state);
  }

  clearState(): void {
    this.state = null;
    this.destroyTiles();
    this.destroyDynamic();
    this.selection.clear();
  }

  destroy(): void {
    this.clearState();
    this.selection.destroy();
  }

  render(timeMs: number, deltaMs: number): void {
    const state = this.state;
    if (!state) return;

    const preferences = getVisualPreferences();
    const animated = preferences.ambientMotionEnabled && preferences.quality !== "low";

    this.selection.clear();

    for (let index = 0; index < state.players.length; index++) {
      const player = state.players[index];
      const visual = this.players.get(player.id);
      if (!visual) continue;

      const waypoint = visual.waypoints[0];
      if (waypoint) {
        visual.facing = waypoint.facing;
        const pixelsPerMs = TILE / tileDurationMs(player.speedTier);
        const distance = Math.max(0, deltaMs) * pixelsPerMs;
        visual.x = moveToward(visual.x, waypoint.x, distance);
        visual.y = moveToward(visual.y, waypoint.y, distance);

        if (visual.x === waypoint.x && visual.y === waypoint.y) {
          visual.waypoints.shift();
          if (visual.waypoints[0]) visual.facing = visual.waypoints[0].facing;
        }
      }
      visual.image.setPosition(visual.x, visual.y);

      const variant = avatarVariant(this.presentations[player.id]);
      const identityColor = playerColor(index);
      visual.image.setTint(identityColor);
      visual.image.setAlpha(variant === "ghost" ? 0.86 : 1);

      if (player.alive) {
        visual.image.setVisible(true);
        const moving = visual.waypoints.length > 0 || timeMs < visual.movingUntilMs;
        visual.image.setFrame(playerFrame(variant, visual.facing, moving, timeMs, animated));

        this.selection.fillStyle(identityColor, 0.95);
        this.selection.fillRect(visual.x - 9, visual.y + 19, 18, 3);

        const team = teamColor(player.teamId);
        if (team !== null) {
          this.selection.lineStyle(2, team, 0.82);
          this.selection.strokeCircle(visual.x, visual.y, 19);
        }

        if (player.id.startsWith("bot-")) {
          this.selection.fillStyle(identityColor, 0.95);
          this.selection.fillTriangle(
            visual.x,
            visual.y - 24,
            visual.x - 5,
            visual.y - 17,
            visual.x + 5,
            visual.y - 17
          );
        }

        if (player.id === this.selfId) {
          this.selection.lineStyle(2, 0xffffff, 0.95);
          this.selection.strokeRect(visual.x - 18, visual.y - 19, 36, 38);
          this.selection.lineStyle(1, identityColor, 0.9);
          this.selection.strokeCircle(visual.x, visual.y, 23);
        }
        continue;
      }

      const eliminatedAtMs = visual.eliminatedAtMs;
      if (eliminatedAtMs === null) {
        visual.image.setVisible(false);
        continue;
      }

      const elapsed = Math.max(0, timeMs - eliminatedAtMs);
      const duration = animated ? 520 : 300;
      if (elapsed >= duration) {
        visual.image.setVisible(false);
        continue;
      }

      visual.image.setVisible(true);
      visual.image.setFrame(eliminationFrame(variant, elapsed, animated));
    }

    for (const core of state.cores) {
      const visualState = this.cores.get(core.id);
      if (!visualState) continue;
      const age = Math.max(0, timeMs - visualState.placedAtMs);
      if (animated && age < 240) {
        visualState.image.setFrame(corePlacementFrame(age));
        visualState.image.setScale(1);
        continue;
      }
      const visual = fuseVisual(core.fuseMs);
      visualState.image.setFrame(coreFrame(visual.urgency, timeMs, animated));
      visualState.image.setScale(1 + visual.urgency * 0.06);
    }

    for (const pickup of state.pickups) {
      if (!pickup.revealed) continue;
      const image = this.pickups.get(pickupKey(pickup));
      if (!image) continue;
      image.setFrame(pickupFrame(pickup.kind, timeMs + (pickup.x + pickup.y) * 37, animated));
    }
  }

  private syncTiles(state: GameState): void {
    const geometryChanged = this.tileWidth !== state.width || this.tileHeight !== state.height;
    if (geometryChanged) {
      this.destroyTiles();
      this.tileWidth = state.width;
      this.tileHeight = state.height;
      for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
          const tile = state.tiles[indexOf(state, x, y)];
          this.tiles.push(
            this.scene.add
              .image(x * TILE, y * TILE, PRODUCTION_ATLAS_KEY, tileFrame(state.mapId, tile))
              .setOrigin(0, 0)
              .setDepth(1.1)
          );
        }
      }
      this.lastTiles = [...state.tiles];
      this.tileMapId = state.mapId;
      return;
    }

    const mapChanged = this.tileMapId !== state.mapId;
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const index = indexOf(state, x, y);
        const tile = state.tiles[index];
        if (mapChanged || this.lastTiles[index] !== tile) {
          this.tiles[index]?.setFrame(tileFrame(state.mapId, tile));
          this.lastTiles[index] = tile;
        }
      }
    }
    this.tileMapId = state.mapId;
  }

  private syncPlayers(state: GameState): void {
    const ids = new Set(state.players.map((player) => player.id));
    for (const [id, visual] of this.players) {
      if (!ids.has(id)) {
        visual.image.destroy();
        this.players.delete(id);
      }
    }

    for (const player of state.players) {
      const targetX = player.x * TILE + TILE / 2;
      const targetY = player.y * TILE + TILE / 2;
      const visual = this.players.get(player.id);
      if (!visual) {
        const variant = avatarVariant(this.presentations[player.id]);
        const image = this.scene.add
          .image(targetX, targetY, PRODUCTION_ATLAS_KEY, playerFrame(variant, "down", false, 0, false))
          .setDepth(2.3);
        this.players.set(player.id, {
          image,
          x: targetX,
          y: targetY,
          targetX,
          targetY,
          facing: "down",
          waypoints: [],
          movingUntilMs: 0,
          alive: player.alive,
          eliminatedAtMs: player.alive ? null : this.scene.time.now
        });
        continue;
      }

      if (visual.targetX !== targetX || visual.targetY !== targetY) {
        const tileDistance = (Math.abs(targetX - visual.targetX) + Math.abs(targetY - visual.targetY)) / TILE;
        if (tileDistance !== 1 || visual.waypoints.length >= 4) {
          visual.x = targetX;
          visual.y = targetY;
          visual.waypoints.length = 0;
        } else {
          const facing = inferFacing(visual.targetX, visual.targetY, targetX, targetY, visual.facing);
          visual.waypoints.push({ x: targetX, y: targetY, facing });
          if (visual.waypoints.length === 1) visual.facing = facing;
          visual.movingUntilMs = this.scene.time.now + tileDurationMs(player.speedTier);
        }
        visual.targetX = targetX;
        visual.targetY = targetY;
      }

      if (visual.alive && !player.alive) {
        visual.eliminatedAtMs = this.scene.time.now;
        visual.waypoints.length = 0;
      } else if (!visual.alive && player.alive) {
        visual.eliminatedAtMs = null;
        visual.x = targetX;
        visual.y = targetY;
        visual.targetX = targetX;
        visual.targetY = targetY;
        visual.waypoints.length = 0;
        visual.image.setVisible(true);
      }
      visual.alive = player.alive;
    }
  }

  private syncCores(state: GameState): void {
    const ids = new Set(state.cores.map((core) => core.id));
    for (const [id, visual] of this.cores) {
      if (!ids.has(id)) {
        visual.image.destroy();
        this.cores.delete(id);
      }
    }
    for (const core of state.cores) {
      if (this.cores.has(core.id)) continue;
      this.cores.set(core.id, this.makeCore(core));
    }
  }

  private makeCore(core: SimCore): CoreSpriteState {
    return {
      image: this.scene.add
        .image(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, PRODUCTION_ATLAS_KEY, 96)
        .setDepth(2.1),
      placedAtMs: this.scene.time.now
    };
  }

  private syncPickups(state: GameState): void {
    const visible = new Set(state.pickups.filter((pickup) => pickup.revealed).map(pickupKey));
    for (const [key, image] of this.pickups) {
      if (!visible.has(key)) {
        image.destroy();
        this.pickups.delete(key);
      }
    }
    for (const pickup of state.pickups) {
      if (!pickup.revealed) continue;
      const key = pickupKey(pickup);
      if (this.pickups.has(key)) continue;
      this.pickups.set(
        key,
        this.scene.add
          .image(
            pickup.x * TILE + TILE / 2,
            pickup.y * TILE + TILE / 2,
            PRODUCTION_ATLAS_KEY,
            pickupFrame(pickup.kind, 0, false)
          )
          .setDepth(2.2)
      );
    }
  }

  private destroyTiles(): void {
    for (const image of this.tiles) image.destroy();
    this.tiles.length = 0;
    this.lastTiles = [];
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.tileMapId = "";
  }

  private destroyDynamic(): void {
    for (const visual of this.players.values()) visual.image.destroy();
    for (const visual of this.cores.values()) visual.image.destroy();
    for (const image of this.pickups.values()) image.destroy();
    this.players.clear();
    this.cores.clear();
    this.pickups.clear();
  }
}
