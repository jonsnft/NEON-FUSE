import { GameObjects, Input, Scene } from "phaser";
import {
  PROTOCOL_VERSION,
  playerById,
  type Direction,
  type GameState,
  type MatchSnapshot
} from "@neon-fuse/shared";
import { MatchConnection } from "../net/MatchConnection";
import { renderWorld } from "../render/renderWorld";

export class OnlineGameScene extends Scene {
  private state: GameState | null = null;
  private connection = new MatchConnection();
  private graphics!: GameObjects.Graphics;
  private status!: GameObjects.Text;
  private keys!: Record<string, Input.Keyboard.Key>;
  private nextMoveAt = 0;
  private seq = 0;
  private connectionStatus = "CONNECTING";

  constructor() {
    super("online-game");
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.status = this.add.text(10, 8, "CONNECTING", {
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
      core: Input.Keyboard.KeyCodes.SPACE
    }) as Record<string, Input.Keyboard.Key>;

    void this.connection.connect(
      (snapshot) => this.acceptSnapshot(snapshot),
      (networkStatus) => {
        this.connectionStatus = networkStatus;
        this.renderStatus();
      }
    ).catch((error: unknown) => {
      this.connectionStatus = error instanceof Error ? error.message : "CONNECTION FAILED";
      this.renderStatus();
    });
  }

  update(time: number): void {
    if (!this.state || this.state.phase !== "playing") return;
    const selfId = this.connection.playerId;
    if (!selfId) return;

    if (Input.Keyboard.JustDown(this.keys.core)) {
      this.connection.send({
        type: "core.place",
        version: PROTOCOL_VERSION,
        seq: ++this.seq
      });
    }

    const player = playerById(this.state, selfId);
    const direction = this.heldDirection();
    const moveDelay = Math.max(55, 130 - (player?.speedTier ?? 0) * 15);

    if (direction && time >= this.nextMoveAt) {
      this.connection.send({
        type: "player.move",
        version: PROTOCOL_VERSION,
        seq: ++this.seq,
        direction
      });
      this.nextMoveAt = time + moveDelay;
    }
  }

  private acceptSnapshot(snapshot: MatchSnapshot): void {
    if (snapshot.status === "waiting") {
      this.state = null;
      this.connectionStatus = `WAITING ${snapshot.connectedPlayers}/${snapshot.requiredPlayers}`;
      this.graphics.clear();
      this.renderStatus();
      return;
    }

    this.state = snapshot.game;
    renderWorld(this.graphics, this.state, this.connection.playerId ?? undefined);
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
    if (!this.state) {
      this.status.setText(this.connectionStatus);
      return;
    }

    if (this.state.phase === "finished") {
      this.status.setText(
        this.state.winnerId
          ? this.state.winnerId === this.connection.playerId
            ? "ROUND WON"
            : "ROUND LOST"
          : "ROUND DRAW"
      );
      return;
    }

    const self = this.connection.playerId
      ? playerById(this.state, this.connection.playerId)
      : undefined;

    this.status.setText(
      self
        ? `ONLINE // RANGE ${self.blastRange}  CORES ${self.coreCapacity}  SPEED ${self.speedTier}`
        : this.connectionStatus
    );
  }
}
