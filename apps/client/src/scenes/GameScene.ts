import { Input, Scene } from "phaser";
import {
  createArena,
  movePlayer,
  placeCore,
  playerById,
  tickSimulation,
  type Direction,
  type GameState
} from "@neon-fuse/shared";
import { CyberpunkAssetLayer } from "../render/CyberpunkAssetLayer";
import { NeonWorldRenderer } from "../render/NeonWorldRenderer";
import { SpriteAtlasLayer } from "../render/SpriteAtlasLayer";
import { preloadProductionAtlas } from "../render/spriteAtlas";
import { MatchHud } from "../ui/MatchHud";

const LOCAL_PLAYER = "local-player";
const TILE = 48;

export class GameScene extends Scene {
  private state!: GameState;
  private worldRenderer!: NeonWorldRenderer;
  private assetLayer!: CyberpunkAssetLayer | SpriteAtlasLayer;
  private hud!: MatchHud;
  private keys!: Record<string, Input.Keyboard.Key>;
  private nextMoveAt = 0;

  constructor() {
    super("game");
  }

  preload(): void {
    preloadProductionAtlas(this);
  }

  create(): void {
    this.state = createArena([LOCAL_PLAYER]);
    this.worldRenderer = new NeonWorldRenderer(this);
    this.assetLayer = SpriteAtlasLayer.isAvailable(this)
      ? new SpriteAtlasLayer(this)
      : new CyberpunkAssetLayer(this);
    this.hud = new MatchHud(this);
    this.hud.setArenaWidth(this.state.width * TILE);

    if (!this.input.keyboard) throw new Error("Keyboard input unavailable");

    this.keys = this.input.keyboard.addKeys({
      up: Input.Keyboard.KeyCodes.UP,
      down: Input.Keyboard.KeyCodes.DOWN,
      left: Input.Keyboard.KeyCodes.LEFT,
      right: Input.Keyboard.KeyCodes.RIGHT,
      w: Input.Keyboard.KeyCodes.W,
      s: Input.Keyboard.KeyCodes.S,
      a: Input.Keyboard.KeyCodes.A,
      d: Input.Keyboard.KeyCodes.D,
      core: Input.Keyboard.KeyCodes.SPACE,
      reset: Input.Keyboard.KeyCodes.R
    }) as Record<string, Input.Keyboard.Key>;

    this.worldRenderer.setState(this.state, LOCAL_PLAYER);
    this.assetLayer.setState(this.state, LOCAL_PLAYER);
    this.worldRenderer.render(0, 0);
    this.assetLayer.render(0, 0);
    this.renderStatus();

    this.events.once("shutdown", () => {
      this.hud.destroy();
      this.assetLayer.destroy();
      this.worldRenderer.destroy();
    });
  }

  update(time: number, delta: number): void {
    if (Input.Keyboard.JustDown(this.keys.reset)) {
      this.state = createArena([LOCAL_PLAYER]);
      this.hud.setArenaWidth(this.state.width * TILE);
      this.worldRenderer.clearState();
      this.assetLayer.clearState();
    }

    if (Input.Keyboard.JustDown(this.keys.core)) {
      placeCore(this.state, LOCAL_PLAYER);
    }

    const player = playerById(this.state, LOCAL_PLAYER);
    const direction = this.heldDirection();
    const moveDelay = Math.max(55, 130 - (player?.speedTier ?? 0) * 15);
    if (direction && time >= this.nextMoveAt) {
      movePlayer(this.state, LOCAL_PLAYER, direction);
      this.nextMoveAt = time + moveDelay;
    }

    tickSimulation(this.state, Math.min(delta, 100));
    this.worldRenderer.setState(this.state, LOCAL_PLAYER);
    this.assetLayer.setState(this.state, LOCAL_PLAYER);
    this.worldRenderer.render(time, delta);
    this.assetLayer.render(time, delta);
    this.renderStatus();
  }

  private heldDirection(): Direction | null {
    if (this.keys.up.isDown || this.keys.w.isDown) return "up";
    if (this.keys.down.isDown || this.keys.s.isDown) return "down";
    if (this.keys.left.isDown || this.keys.a.isDown) return "left";
    if (this.keys.right.isDown || this.keys.d.isDown) return "right";
    return null;
  }

  private renderStatus(): void {
    const player = playerById(this.state, LOCAL_PLAYER);
    if (!player?.alive) {
      this.hud.show(
        "OFFLINE SIMULATION",
        "SIGNAL LOST",
        `MAP ${this.state.mapId}\nRANGE ${player?.blastRange ?? "-"}   CORES ${player?.coreCapacity ?? "-"}   SPEED ${player?.speedTier ?? "-"}`,
        "R  REBOOT",
        "danger"
      );
      return;
    }

    this.hud.show(
      "OFFLINE SIMULATION",
      "LOCAL TEST",
      `MAP ${this.state.mapId}\nRANGE ${player.blastRange}   CORES ${player.coreCapacity}   SPEED ${player.speedTier}`,
      "WASD / ARROWS  MOVE\nSPACE  PLACE CORE\nR  REBOOT"
    );
  }
}
