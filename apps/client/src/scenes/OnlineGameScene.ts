import { GameObjects, Input, Scene } from "phaser";
import {
  ITEM_PRESET_IDS,
  MODIFIER_PRESET_IDS,
  OFFICIAL_MAP_IDS,
  OFFICIAL_MAPS,
  PROTOCOL_VERSION,
  isSuddenDeath,
  playerById,
  remainingRoundMs,
  type Direction,
  type GameState,
  type MatchSnapshot
} from "@neon-fuse/shared";
import { MatchConnection } from "../net/MatchConnection";
import { renderWorld } from "../render/renderWorld";
import { Sfx } from "../audio/Sfx";
import { LobbyChat } from "../ui/LobbyChat";

interface OnlineSceneData {
  roomId?: string;
}

export class OnlineGameScene extends Scene {
  private state: GameState | null = null;
  private snapshot: MatchSnapshot | null = null;
  private connection = new MatchConnection();
  private graphics!: GameObjects.Graphics;
  private status!: GameObjects.Text;
  private help!: GameObjects.Text;
  private chat!: LobbyChat;
  private keys!: Record<string, Input.Keyboard.Key>;
  private nextMoveAt = 0;
  private seq = 0;
  private connectionStatus = "CONNECTING";
  private roomId?: string;
  private readonly sfx = new Sfx();
  private previousGame: GameState | null = null;
  private suddenDeathAnnounced = false;

  constructor() {
    super("online-game");
  }

  init(data: OnlineSceneData): void {
    this.roomId = data.roomId;
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
      color: "#e9ff70",
      wordWrap: { width: 1000 }
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
      start: Input.Keyboard.KeyCodes.ENTER,
      mapOrRematch: Input.Keyboard.KeyCodes.M,
      players: Input.Keyboard.KeyCodes.P,
      items: Input.Keyboard.KeyCodes.I,
      modifier: Input.Keyboard.KeyCodes.G,
      lobby: Input.Keyboard.KeyCodes.ESC
    }) as Record<string, Input.Keyboard.Key>;

    this.chat = new LobbyChat(
      this,
      (text) => this.connection.sendChat(text),
      () => this.connection.playerId
    );

    this.events.once("shutdown", () => {
      this.chat.destroy();
      void this.connection.disconnect();
    });

    void this.connection.connect(
      (snapshot) => this.acceptSnapshot(snapshot),
      (networkStatus) => {
        this.connectionStatus = networkStatus;
        this.renderStatus();
      },
      (message) => this.chat.receive(message),
      this.roomId
    ).catch((error: unknown) => {
      this.connectionStatus = error instanceof Error ? error.message : "CONNECTION FAILED";
      this.renderStatus();
    });
  }

  update(time: number): void {
    if (this.chat.isTyping) return;

    if (Input.Keyboard.JustDown(this.keys.lobby)) {
      this.scene.start("lobby");
      return;
    }

    if (this.snapshot?.status === "waiting") {
      const selfId = this.connection.playerId;
      const isCreator = Boolean(selfId && selfId === this.snapshot.creatorPlayerId);

      if (isCreator) this.handleCreatorConfig();

      if (Input.Keyboard.JustDown(this.keys.ready)) {
        const ready = selfId ? !this.snapshot.readyPlayerIds.includes(selfId) : true;
        this.connection.send({
          type: "match.ready",
          version: PROTOCOL_VERSION,
          ready
        });
      }

      const allReady =
        this.snapshot.connectedPlayers >= this.snapshot.requiredPlayers &&
        this.snapshot.readyPlayerIds.length === this.snapshot.connectedPlayers;
      if (isCreator && allReady && Input.Keyboard.JustDown(this.keys.start)) {
        this.connection.send({
          type: "match.start",
          version: PROTOCOL_VERSION
        });
      }
      return;
    }

    if (this.snapshot?.status === "finished") {
      if (Input.Keyboard.JustDown(this.keys.mapOrRematch)) {
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

  private handleCreatorConfig(): void {
    if (this.snapshot?.status !== "waiting") return;
    const config = this.snapshot.config;

    if (Input.Keyboard.JustDown(this.keys.mapOrRematch)) {
      const index = OFFICIAL_MAP_IDS.indexOf(config.mapId);
      this.connection.configureLobby({
        mapId: OFFICIAL_MAP_IDS[(index + 1) % OFFICIAL_MAP_IDS.length]
      });
    }

    if (Input.Keyboard.JustDown(this.keys.players)) {
      const minimum = Math.max(this.snapshot.connectedPlayers, this.snapshot.requiredPlayers);
      const next = config.maxPlayers >= 8 ? minimum : Math.max(minimum, config.maxPlayers + 1);
      this.connection.configureLobby({ maxPlayers: next });
    }

    if (Input.Keyboard.JustDown(this.keys.items)) {
      const index = ITEM_PRESET_IDS.indexOf(config.itemPresetId);
      this.connection.configureLobby({
        itemPresetId: ITEM_PRESET_IDS[(index + 1) % ITEM_PRESET_IDS.length]
      });
    }

    if (Input.Keyboard.JustDown(this.keys.modifier)) {
      const index = MODIFIER_PRESET_IDS.indexOf(config.modifierPresetId);
      this.connection.configureLobby({
        modifierPresetId: MODIFIER_PRESET_IDS[(index + 1) % MODIFIER_PRESET_IDS.length]
      });
    }
  }

  private acceptSnapshot(snapshot: MatchSnapshot): void {
    this.snapshot = snapshot;

    if (snapshot.status === "waiting") {
      this.state = null;
      this.graphics.clear();
      this.chat.setEnabled(true);
      this.renderStatus();
      return;
    }

    this.chat.setEnabled(false);
    this.playSnapshotCues(snapshot.game, snapshot.status);
    this.state = snapshot.game;
    renderWorld(this.graphics, this.state, this.connection.playerId ?? undefined, snapshot.presentations);
    this.previousGame = structuredClone(snapshot.game);
    this.renderStatus();
  }

  private playSnapshotCues(game: GameState, status: "playing" | "finished"): void {
    const previous = this.previousGame;

    if (previous) {
      if (game.cores.length > previous.cores.length) this.sfx.core();
      if (game.blasts.length > previous.blasts.length) this.sfx.blast();
    }

    if (isSuddenDeath(game) && !this.suddenDeathAnnounced) {
      this.suddenDeathAnnounced = true;
      this.sfx.warning();
    }

    if (status === "finished" && previous?.phase === "playing") {
      const selfId = this.connection.playerId;
      if (!game.winnerId) this.sfx.draw();
      else if (game.winnerId === selfId) this.sfx.victory();
      else this.sfx.defeat();
    }

    if (status === "playing" && previous?.phase === "finished") {
      this.suddenDeathAnnounced = false;
    }
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
      const isCreator = Boolean(selfId && selfId === this.snapshot.creatorPlayerId);
      const allReady =
        this.snapshot.connectedPlayers >= this.snapshot.requiredPlayers &&
        this.snapshot.readyPlayerIds.length === this.snapshot.connectedPlayers;
      const config = this.snapshot.config;
      const mapName = OFFICIAL_MAPS[config.mapId].displayName.toUpperCase();

      this.status.setText(
        `WAITING ${this.snapshot.connectedPlayers}/${config.maxPlayers} // READY ${this.snapshot.readyPlayerIds.length}/${this.snapshot.connectedPlayers} // MAP ${mapName} // ITEMS ${config.itemPresetId.toUpperCase()} // MOD ${config.modifierPresetId.toUpperCase()}${isCreator ? " // CREATOR" : ""}`
      );

      if (isCreator) {
        const start = allReady ? "ENTER START // " : "";
        const readyHelp = ready ? "R UNREADY" : "R READY";
        this.help.setText(
          `${start}M MAP // P PLAYERS // I ITEMS // G MODIFIER // ${readyHelp} // T CHAT // ESC LOBBY`
        );
      } else if (allReady) {
        this.help.setText("ALL READY // WAITING FOR CREATOR // T CHAT // ESC LOBBY");
      } else {
        this.help.setText(ready ? "R UNREADY // T CHAT // ESC LOBBY" : "R READY // T CHAT // ESC LOBBY");
      }
      return;
    }

    if (this.snapshot.status === "finished") {
      const outcome = this.state?.winnerId
        ? this.state.winnerId === selfId ? "ROUND WON" : "ROUND LOST"
        : "ROUND DRAW";
      const voted = selfId ? this.snapshot.rematchPlayerIds.includes(selfId) : false;
      this.status.setText(
        `${outcome} // MAP ${this.state?.mapId ?? "-"} // ITEMS ${this.state?.rules.itemPresetId ?? "-"} // MOD ${this.state?.rules.modifierPresetId ?? "-"}`
      );
      this.help.setText(voted ? "REMATCH VOTE SENT // ESC LOBBY" : "M VOTE REMATCH // ESC LOBBY");
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
    this.help.setText("WASD/ARROWS MOVE // SPACE CORE // ESC LOBBY");
  }
}
