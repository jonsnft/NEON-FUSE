import { GameObjects, Input, Scene } from "phaser";
import {
  createArena,
  movePlayer,
  placeCore,
  playerById,
  tickSimulation,
  type Direction,
  type GameState
} from "@neon-fuse/shared";
import { renderWorld } from "../render/renderWorld";

const LOCAL_PLAYER = "local-player";

export class GameScene extends Scene {
  private state!: GameState;
  private graphics!: GameObjects.Graphics;
  private status!: GameObjects.Text;
  private keys!: Record<string, Input.Keyboard.Key>;
  private nextMoveAt = 0;

  constructor() {
    super("game");
  }

  create(): void {
    this.state = createArena([LOCAL_PLAYER]);
    this.graphics = this.add.graphics();
    this.status = this.add.text(10, 8, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#dff"
    }).setDepth(10);

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

    this.renderState();
  }

  update(time: number, delta: number): void {
    if (Input.Keyboard.JustDown(this.keys.reset)) {
      this.state = createArena([LOCAL_PLAYER]);
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
    this.renderState();
  }

  private heldDirection(): Direction | null {
    if (this.keys.up.isDown || this.keys.w.isDown) return "up";
    if (this.keys.down.isDown || this.keys.s.isDown) return "down";
    if (this.keys.left.isDown || this.keys.a.isDown) return "left";
    if (this.keys.right.isDown || this.keys.d.isDown) return "right";
    return null;
  }

  private renderState(): void {
    renderWorld(this.graphics, this.state, LOCAL_PLAYER);
    const player = playerById(this.state, LOCAL_PLAYER);
    this.status.setText(
      player?.alive
        ? `OFFLINE // RANGE ${player.blastRange}  CORES ${player.coreCapacity}  SPEED ${player.speedTier}`
        : "SIGNAL LOST // PRESS R TO REBOOT"
    );
  }
}
