import { GameObjects, Input, Scene } from "phaser";
import {
  PROTOCOL_VERSION,
  isSuddenDeath,
  playerById,
  remainingRoundMs,
  type Direction,
  type GameState,
  type MatchSnapshot,
  type OfficialMapId
} from "@neon-fuse/shared";
import { MatchConnection } from "../net/MatchConnection";
import { renderWorld } from "../render/renderWorld";

interface OnlineSceneData {
  roomId?: string;
  mapId?: OfficialMapId;
}

export class OnlineGameScene extends Scene {
  private state: GameState | null = null;
  private snapshot: MatchSnapshot | null = null;
  private connection = new MatchConnection();
  private graphics!: GameObjects.Graphics;
  private status!: GameObjects.Text;
  private help!: GameObjects.Text;
  private keys!: Record<string, Input.Keyboard.Key>;
  private nextMoveAt = 0;
  private seq = 0;
  private connectionStatus = "CONNECTING";
  private roomId?: string;
  private mapId: OfficialMapId = "grid-zero";

  constructor() {
    super("online-game");
  }

  init(data: OnlineSceneData): void {
    this.roomId = data.roomId;
    this.mapId = data.mapId ?? "grid-zero";
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.status = this.add.text(10, 8, "CONNECTING", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#dff"
    }).setDepth(10);
    this.help = this.add.text(10, 32, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#e9ff70"
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
      ready: Input.Keyboard.KeyCodes.R,
      rematch: Input.Keyboard.KeyCodes.M
    }) as Record<string, Input.Keyboard.Key>;

    void this.connection.connect(
      (snapshot) => this.acceptSnapshot(snapshot),
      (networkStatus) => {
        this.connectionStatus = networkStatus;
        this.renderStatus();
      },
      this.roomId,
      this.mapId
    ).catch((error: unknown) => {
      this.connectionStatus = error instanceof Error ? error.message : "CONNECTION FAILED";
      this.renderStatus();
    });
  }

  update(time: number): void {
    if (this.snapshot?.status === "waiting") {
      if (Input.Keyboard.JustDown(this.keys.ready)) {
        const selfId = this.connection.playerId;
        const ready = selfId ? !this.snapshot.readyPlayerIds.includes(selfId) : true;
        this.connection.send({
          type: "match.ready",
          version: PROTOCOL_VERSION,
          ready
        });
      }
      return;
    }

    if (this.snapshot?.status === "finished") {
      if (Input.Keyboard.JustDown(this.keys.rematch)) {
        this.connection.send({
          type: "match.rematch",
          version: PROTOCOL_VERSION
        });
      }
      return;
    }

    if (!this.state || this.state.phase !== "playing") return;
    const selfId = this.connection.playerId;
    if (!selfId) return;
    const self = playerById(this.state, selfId);
    if (!self?.alive) return;

    if (Input.Keyboard.JustDown(this.keys.core)) {
      this.connection.send({
        type: "core.place",
        version: PROTOCOL_VERSION,
        seq: ++this.seq
      });
    }

    const direction = this.heldDirection();
    const moveDelay = Math.max(55, 130 - self.speedTier * 15);

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
    this.snapshot = snapshot;

    if (snapshot.status === "waiting") {
      this.state = null;
      this.graphics.clear();
      this.renderStatus();
      return;
    }

    this.state = snapshot.game;
    renderWorld(this.graphics, this.state, this.connection.playerId ?? undefined, snapshot.presentations);
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
    const selfId = this.connection.playerId;

    if (!this.snapshot) {
      this.status.setText(this.connectionStatus);
      this.help.setText("");
      return;
    }

    if (this.snapshot.status === "waiting") {
      const ready = selfId ? this.snapshot.readyPlayerIds.includes(selfId) : false;
      const map = this.snapshot.mapId ?? this.mapId;
      this.status.setText(
        `WAITING ${this.snapshot.connectedPlayers}/${this.snapshot.maxPlayers} // READY ${this.snapshot.readyPlayerIds.length}/${this.snapshot.connectedPlayers} // MAP ${map}`
      );
      this.help.setText(ready ? "R = UNREADY" : "R = READY");
      return;
    }

    if (this.snapshot.status === "finished") {
      const outcome = this.state?.winnerId
        ? this.state.winnerId === selfId ? "ROUND WON" : "ROUND LOST"
        : "ROUND DRAW";
      const voted = selfId ? this.snapshot.rematchPlayerIds.includes(selfId) : false;
      this.status.setText(`${outcome} // MAP ${this.state?.mapId ?? this.mapId}`);
      this.help.setText(voted ? "REMATCH VOTE SENT" : "M = VOTE REMATCH");
      return;
    }

    const self = selfId && this.state ? playerById(this.state, selfId) : undefined;
    if (!self || !this.state) {
      this.status.setText(this.connectionStatus);
      this.help.setText("");
      return;
    }

    const seconds = Math.ceil(remainingRoundMs(this.state) / 1000);
    const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    const danger = isSuddenDeath(this.state) ? " // SUDDEN DEATH" : "";

    if (!self.alive) {
      this.status.setText(`SPECTATING // ${clock}${danger} // MAP ${this.state.mapId}`);
      this.help.setText("");
      return;
    }

    this.status.setText(
      `ONLINE // ${clock}${danger} // MAP ${this.state.mapId} // RANGE ${self.blastRange} CORES ${self.coreCapacity} SPEED ${self.speedTier}`
    );
    this.help.setText("WASD/ARROWS MOVE // SPACE CORE");
  }
}
