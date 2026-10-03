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
  pickupFrame,
  playerFrame,
  tileFrame
} from "./spriteAtlas";

const TILE = 48;

interface PlayerSpriteState {
  image: GameObjects.Image;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: Facing;
  movingUntilMs: number;
}

const avatarTint = (presentation?: PlayerPresentation): number => {
  const token = presentation ? cosmeticById(presentation.loadout.avatar)?.visualToken : undefined;
  if (token === "lime") return 0xe9ff70;
  if (token === "ghost") return 0xa56bff;
  return 0xffffff;
};

const pickupKey = (pickup: SimPickup): string => `${pickup.x}:${pickup.y}:${pickup.kind}`;

export class SpriteAtlasLayer {
  static isAvailable(scene: Scene): boolean {
    return scene.textures.exists(PRODUCTION_ATLAS_KEY);
  }

  private state: GameState | null = null;
  private selfId?: string;
  private presentations: Record<string, PlayerPresentation> = {};
  private readonly tiles: GameObjects.Image[] = [];
  private readonly players = new Map<string, PlayerSpriteState>();
  private readonly cores = new Map<string, GameObjects.Image>();
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
    const follow = 1 - Math.exp(-Math.max(0, deltaMs) / 70);

    this.selection.clear();

    for (const player of state.players) {
      const visual = this.players.get(player.id);
      if (!visual) continue;
      visual.image.setVisible(player.alive);
      if (!player.alive) continue;

      visual.x += (visual.targetX - visual.x) * follow;
      visual.y += (visual.targetY - visual.y) * follow;
      visual.image.setPosition(visual.x, visual.y);

      const moving = animated && timeMs < visual.movingUntilMs;
      visual.image.setFrame(playerFrame(visual.facing, moving));
      visual.image.setTint(avatarTint(this.presentations[player.id]));

      if (player.id === this.selfId) {
        this.selection.lineStyle(1, 0xffffff, 0.9);
        this.selection.strokeRect(visual.x - 17, visual.y - 18, 34, 36);
        this.selection.lineStyle(1, 0x53f3ff, 0.7);
        this.selection.strokeCircle(visual.x, visual.y, 21);
      }
    }

    for (const core of state.cores) {
      const image = this.cores.get(core.id);
      if (!image) continue;
      const visual = fuseVisual(core.fuseMs);
      image.setFrame(coreFrame(visual.urgency, timeMs, animated));
      image.setScale(1 + visual.urgency * 0.06);
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
        const image = this.scene.add
          .image(targetX, targetY, PRODUCTION_ATLAS_KEY, playerFrame("down", false))
          .setDepth(2.3);
        this.players.set(player.id, {
          image,
          x: targetX,
          y: targetY,
          targetX,
          targetY,
          facing: "down",
          movingUntilMs: 0
        });
        continue;
      }

      if (visual.targetX !== targetX || visual.targetY !== targetY) {
        visual.facing = inferFacing(visual.targetX, visual.targetY, targetX, targetY, visual.facing);
        visual.movingUntilMs = this.scene.time.now + 150;
        visual.targetX = targetX;
        visual.targetY = targetY;
      }
    }
  }

  private syncCores(state: GameState): void {
    const ids = new Set(state.cores.map((core) => core.id));
    for (const [id, image] of this.cores) {
      if (!ids.has(id)) {
        image.destroy();
        this.cores.delete(id);
      }
    }
    for (const core of state.cores) {
      if (this.cores.has(core.id)) continue;
      this.cores.set(core.id, this.makeCore(core));
    }
  }

  private makeCore(core: SimCore): GameObjects.Image {
    return this.scene.add
      .image(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, PRODUCTION_ATLAS_KEY, "core-0")
      .setDepth(2.1);
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
    for (const image of this.cores.values()) image.destroy();
    for (const image of this.pickups.values()) image.destroy();
    this.players.clear();
    this.cores.clear();
    this.pickups.clear();
  }
}
