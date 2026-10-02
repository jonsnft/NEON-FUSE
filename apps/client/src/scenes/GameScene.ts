import Phaser from "phaser";
import {
  createArena,
  indexOf,
  movePlayer,
  placeCore,
  tickSimulation,
  type Direction,
  type GameState
} from "@neon-fuse/shared";

const TILE = 48;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private graphics!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private nextMoveAt = 0;

  constructor() {
    super("game");
  }

  create(): void {
    this.state = createArena();
    this.graphics = this.add.graphics();
    this.status = this.add.text(10, 8, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#dff"
    }).setDepth(10);

    if (!this.input.keyboard) throw new Error("Keyboard input unavailable");

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      core: Phaser.Input.Keyboard.KeyCodes.SPACE,
      reset: Phaser.Input.Keyboard.KeyCodes.R
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.renderState();
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.reset)) {
      this.state = createArena();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.core)) {
      placeCore(this.state);
    }

    const direction = this.heldDirection();
    const moveDelay = Math.max(55, 130 - this.state.player.speedTier * 15);
    if (direction && time >= this.nextMoveAt) {
      movePlayer(this.state, direction);
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
    const g = this.graphics;
    g.clear();

    for (let y = 0; y < this.state.height; y++) {
      for (let x = 0; x < this.state.width; x++) {
        const tile = this.state.tiles[indexOf(this.state, x, y)];
        const px = x * TILE;
        const py = y * TILE;

        g.fillStyle(tile === "hard" ? 0x162f3a : tile === "soft" ? 0x254d59 : 0x0b171d, 1);
        g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);

        if (tile === "floor") {
          g.lineStyle(1, 0x12323d, 0.7);
          g.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        }
      }
    }

    for (const pickup of this.state.pickups) {
      if (!pickup.revealed) continue;
      const color = pickup.kind === "range" ? 0xff4fd8 : pickup.kind === "capacity" ? 0x53f3ff : 0xffe66d;
      g.fillStyle(color, 1);
      g.fillCircle(pickup.x * TILE + TILE / 2, pickup.y * TILE + TILE / 2, 9);
    }

    for (const core of this.state.cores) {
      g.fillStyle(0xff4fd8, 1);
      g.fillCircle(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, 14);
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeCircle(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, 14);
    }

    for (const blast of this.state.blasts) {
      g.fillStyle(0x53f3ff, 0.75);
      g.fillRect(blast.x * TILE + 4, blast.y * TILE + 4, TILE - 8, TILE - 8);
    }

    if (this.state.player.alive) {
      g.fillStyle(0xe9ff70, 1);
      g.fillRect(
        this.state.player.x * TILE + 10,
        this.state.player.y * TILE + 10,
        TILE - 20,
        TILE - 20
      );
    }

    this.status.setText(
      this.state.player.alive
        ? `RANGE ${this.state.player.blastRange}  CORES ${this.state.player.coreCapacity}  SPEED ${this.state.player.speedTier}`
        : "SIGNAL LOST // PRESS R TO REBOOT"
    );
  }
}
