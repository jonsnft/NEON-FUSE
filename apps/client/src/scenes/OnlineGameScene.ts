import { Input, Scene } from "phaser";
import {
  BOT_DIFFICULTIES,
  GAME_MODE_IDS,
  GAME_MODES,
  ITEM_PRESET_IDS,
  MODIFIER_PRESET_IDS,
  OFFICIAL_MAP_IDS,
  OFFICIAL_MAPS,
  PACE_PRESET_IDS,
  PROTOCOL_VERSION,
  gameModePolicyForRules,
  isRespawnMode,
  isSuddenDeath,
  playerById,
  remainingRoundMs,
  scoreForPlayer,
  type Direction,
  type GameState,
  type MatchSnapshot
} from "@neon-fuse/shared";
import { MatchConnection } from "../net/MatchConnection";
import { CombatReadabilityLayer } from "../render/CombatReadabilityLayer";
import { CyberpunkAssetLayer } from "../render/CyberpunkAssetLayer";
import { NeonWorldRenderer } from "../render/NeonWorldRenderer";
import { SpriteAtlasLayer } from "../render/SpriteAtlasLayer";
import { preloadProductionAtlas } from "../render/spriteAtlas";
import { Sfx } from "../audio/Sfx";
import { LobbyChat } from "../ui/LobbyChat";
import { MatchHud } from "../ui/MatchHud";
import {
  finishedHudDetails,
  playingHudDetails,
  rebootHudDetails,
  spectatingHudDetails
} from "../ui/matchHudDetails";

const TILE = 48;

interface OnlineSceneData {
  roomId?: string;
}

export class OnlineGameScene extends Scene {
  private state: GameState | null = null;
  private snapshot: MatchSnapshot | null = null;
  private connection = new MatchConnection();
  private worldRenderer!: NeonWorldRenderer;
  private assetLayer!: CyberpunkAssetLayer | SpriteAtlasLayer;
  private combatLayer!: CombatReadabilityLayer;
  private hud!: MatchHud;
  private chat!: LobbyChat;
  private keys!: Record<string, Input.Keyboard.Key>;
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

  preload(): void {
    preloadProductionAtlas(this);
  }

  create(): void {
    this.worldRenderer = new NeonWorldRenderer(this);
    this.assetLayer = SpriteAtlasLayer.isAvailable(this)
      ? new SpriteAtlasLayer(this)
      : new CyberpunkAssetLayer(this);
    this.combatLayer = new CombatReadabilityLayer(this);
    this.hud = new MatchHud(this);
    this.hud.show("NETWORK", "CONNECTING", "Establishing match session...", "ESC  LOBBY");

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
      mode: Input.Keyboard.KeyCodes.O,
      items: Input.Keyboard.KeyCodes.I,
      modifier: Input.Keyboard.KeyCodes.G,
      pace: Input.Keyboard.KeyCodes.F,
      bots: Input.Keyboard.KeyCodes.B,
      botDifficulty: Input.Keyboard.KeyCodes.H,
      lobby: Input.Keyboard.KeyCodes.ESC
    }) as Record<string, Input.Keyboard.Key>;

    this.chat = new LobbyChat(
      this,
      (text) => this.connection.sendChat(text),
      () => this.connection.playerId
    );

    this.events.once("shutdown", () => {
      this.chat.destroy();
      this.hud.destroy();
      this.combatLayer.destroy();
      this.assetLayer.destroy();
      this.worldRenderer.destroy();
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

  update(time: number, delta: number): void {
    this.worldRenderer.render(time, delta);
    this.assetLayer.render(time, delta);
    this.combatLayer.render(time);
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

    const direction = this.justPressedDirection();
    if (direction) {
      this.connection.send({
        type: "player.move",
        version: PROTOCOL_VERSION,
        seq: ++this.seq,
        direction
      });
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
      const minimum = Math.max(this.snapshot.connectedPlayers + config.botCount, this.snapshot.requiredPlayers + config.botCount);
      const next = config.maxPlayers >= 8 ? minimum : Math.max(minimum, config.maxPlayers + 1);
      this.connection.configureLobby({ maxPlayers: next });
    }

    if (Input.Keyboard.JustDown(this.keys.mode)) {
      const index = GAME_MODE_IDS.indexOf(config.gameModeId);
      this.connection.configureLobby({
        gameModeId: GAME_MODE_IDS[(index + 1) % GAME_MODE_IDS.length]
      });
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

    if (Input.Keyboard.JustDown(this.keys.pace)) {
      const index = PACE_PRESET_IDS.indexOf(config.pacePresetId);
      this.connection.configureLobby({
        pacePresetId: PACE_PRESET_IDS[(index + 1) % PACE_PRESET_IDS.length]
      });
    }

    if (Input.Keyboard.JustDown(this.keys.bots)) {
      const maxBots = Math.max(0, config.maxPlayers - this.snapshot.connectedPlayers);
      const next = config.botCount >= maxBots ? 0 : config.botCount + 1;
      this.connection.configureLobby({ botCount: next });
    }

    if (Input.Keyboard.JustDown(this.keys.botDifficulty)) {
      const index = BOT_DIFFICULTIES.indexOf(config.botDifficulty);
      this.connection.configureLobby({
        botDifficulty: BOT_DIFFICULTIES[(index + 1) % BOT_DIFFICULTIES.length]
      });
    }
  }

  private acceptSnapshot(snapshot: MatchSnapshot): void {
    this.snapshot = snapshot;

    if (snapshot.status === "waiting") {
      this.state = null;
      this.hud.setArenaWidth(0);
      this.worldRenderer.clearState();
      this.assetLayer.clearState();
      this.combatLayer.clearState();
      this.chat.setEnabled(true);
      this.renderStatus();
      return;
    }

    this.chat.setEnabled(false);
    this.playSnapshotCues(snapshot.game, snapshot.status);
    this.state = snapshot.game;
    this.hud.setArenaWidth(this.state.width * TILE);
    this.worldRenderer.setState(
      this.state,
      this.connection.playerId ?? undefined,
      snapshot.presentations
    );
    this.assetLayer.setState(
      this.state,
      this.connection.playerId ?? undefined,
      snapshot.presentations
    );
    this.combatLayer.setState(this.state);
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
      const self = selfId ? playerById(game, selfId) : undefined;
      const teamWin = Boolean(self?.teamId && game.winnerTeamId === self.teamId);
      if (!game.winnerId && !game.winnerTeamId) this.sfx.draw();
      else if (game.winnerId === selfId || teamWin) this.sfx.victory();
      else this.sfx.defeat();
    }

    if (status === "playing" && previous?.phase === "finished") {
      this.suddenDeathAnnounced = false;
    }
  }

  private justPressedDirection(): Direction | null {
    if (Input.Keyboard.JustDown(this.keys.up) || Input.Keyboard.JustDown(this.keys.w)) return "up";
    if (Input.Keyboard.JustDown(this.keys.down) || Input.Keyboard.JustDown(this.keys.s)) return "down";
    if (Input.Keyboard.JustDown(this.keys.left) || Input.Keyboard.JustDown(this.keys.a)) return "left";
    if (Input.Keyboard.JustDown(this.keys.right) || Input.Keyboard.JustDown(this.keys.d)) return "right";
    return null;
  }

  private renderStatus(): void {
    const selfId = this.connection.playerId;

    if (!this.snapshot) {
      this.hud.show("NETWORK", this.connectionStatus, "Waiting for lobby state...", "ESC  LOBBY");
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
      const mode = GAME_MODES[config.gameModeId];
      const modeName = mode.displayName;
      const totalPlayers = this.snapshot.connectedPlayers + config.botCount;
      const primary = `${totalPlayers}/${config.maxPlayers} PLAYERS   ${this.snapshot.readyPlayerIds.length}/${this.snapshot.connectedPlayers} HUMAN READY`;
      const secondary = `${isCreator ? "YOU ARE THE CREATOR" : "WAITING FOR CREATOR"}\n${this.snapshot.connectedPlayers} HUMAN   ${config.botCount} AI`;

      let controls: string;
      if (isCreator) {
        const start = allReady ? "ENTER  START MATCH\n" : "";
        controls = `${start}${ready ? "R  UNREADY" : "R  READY"}   T  CHAT   ESC  LOBBY`;
      } else if (allReady) {
        controls = "ALL HUMANS READY — WAITING FOR CREATOR   T  CHAT   ESC  LOBBY";
      } else {
        controls = `${ready ? "R  UNREADY" : "R  READY"}   T  CHAT   ESC  LOBBY`;
      }

      this.hud.show(
        "MATCH SETUP",
        primary,
        secondary,
        controls,
        allReady ? "success" : "normal",
        {
          objective: `${mode.objective} — ${mode.description}`,
          items: [
            {
              glyph: "O",
              name: "MODE",
              current: modeName,
              description: isCreator ? "O changes mode" : "Selected by creator"
            },
            {
              glyph: "M",
              name: "MAP",
              current: mapName,
              description: isCreator ? "M changes arena" : "Selected arena"
            },
            {
              glyph: "B",
              name: "AI OPPONENTS",
              current: `${config.botCount} / ${config.botDifficulty.toUpperCase()}`,
              description: isCreator ? "B count  •  H difficulty" : "Configured AI roster"
            },
            {
              glyph: "P",
              name: "PLAYER SLOTS",
              current: `${totalPlayers}/${config.maxPlayers}`,
              description: isCreator ? "P changes total capacity" : "Current lobby capacity"
            },
            {
              glyph: "I",
              name: "RULES",
              current: config.itemPresetId.toUpperCase(),
              description: isCreator
                ? `I items  •  G ${config.modifierPresetId.toUpperCase()}  •  F ${config.pacePresetId.toUpperCase()}`
                : `${config.modifierPresetId.toUpperCase()}  •  ${config.pacePresetId.toUpperCase()}`
            }
          ]
        }
      );
      return;
    }

    if (this.snapshot.status === "finished") {
      const state = this.state;
      const self = selfId && state ? playerById(state, selfId) : undefined;
      const teamWin = Boolean(self?.teamId && state?.winnerTeamId === self.teamId);
      const hasWinner = Boolean(state?.winnerId || state?.winnerTeamId);
      const outcome = !hasWinner
        ? "ROUND DRAW"
        : state?.winnerId === selfId || teamWin
          ? "ROUND WON"
          : "ROUND LOST";
      const voted = selfId ? this.snapshot.rematchPlayerIds.includes(selfId) : false;
      const alive = state?.players.filter((player) => player.alive).length ?? 0;
      const total = state?.players.length ?? 0;
      const modeName = state ? GAME_MODES[state.rules.gameModeId].displayName : "-";
      const teamResult = state?.winnerTeamId ? `   WINNER TEAM ${state.winnerTeamId.toUpperCase()}` : "";
      const secondary = `MODE ${modeName}${teamResult}   MAP ${state?.mapId ?? "-"}\nSURVIVORS ${alive}/${total}\nITEMS ${state?.rules.itemPresetId ?? "-"}   PACE ${state?.rules.pacePresetId ?? "-"}`;
      this.hud.show(
        "ROUND COMPLETE",
        outcome,
        secondary,
        voted ? "REMATCH VOTE SENT   ESC LOBBY" : "M VOTE REMATCH   ESC LOBBY",
        outcome === "ROUND WON" ? "success" : outcome === "ROUND LOST" ? "danger" : "normal",
        state ? finishedHudDetails(state, selfId ?? undefined) : {}
      );
      return;
    }

    const self = selfId && this.state ? playerById(this.state, selfId) : undefined;
    if (!self || !this.state || !selfId) {
      this.hud.show("NETWORK", this.connectionStatus, "Waiting for player state...", "ESC  LOBBY");
      return;
    }

    const seconds = Math.ceil(remainingRoundMs(this.state) / 1000);
    const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    const suddenDeath = isSuddenDeath(this.state);
    const alive = this.state.players.filter((player) => player.alive).length;
    const total = this.state.players.length;
    const mode = gameModePolicyForRules(this.state.rules);
    const scoreLabel = this.state.rules.gameModeId === "grid-control" ? "SYNC" : "SCORE";

    if (!self.alive) {
      if (isRespawnMode(this.state) && self.respawnAtMs !== null) {
        this.hud.show(
          "SIGNAL REBOOT",
          clock,
          `${scoreLabel} ${scoreForPlayer(this.state, selfId)}/${mode.scoreTarget ?? "-"}\nMAP ${this.state.mapId}`,
          "REBOOTING...   ESC LOBBY",
          "danger",
          rebootHudDetails(this.state, selfId)
        );
      } else {
        this.hud.show(
          "SIGNAL LOST",
          suddenDeath ? `${clock}  SUDDEN DEATH` : clock,
          `SPECTATING\nALIVE ${alive}/${total}\nMAP ${this.state.mapId}`,
          "ESC  LOBBY",
          "danger",
          spectatingHudDetails(this.state)
        );
      }
      return;
    }

    const primary = suddenDeath ? `${clock}  SUDDEN DEATH` : clock;
    const modeLine = this.state.rules.gameModeId === "grid-control"
      ? `GRID CONTROL   SYNC ${scoreForPlayer(this.state, selfId)}/${mode.scoreTarget ?? "-"}`
      : this.state.rules.gameModeId === "core-rush"
        ? `CORE RUSH   SCORE ${scoreForPlayer(this.state, selfId)}/${mode.scoreTarget ?? "-"}`
        : this.state.rules.gameModeId === "classic-team-deathmatch"
          ? `CLASSIC TEAM DM   TEAM ${self.teamId?.toUpperCase() ?? "-"}`
          : `CLASSIC DEATHMATCH   ALIVE ${alive}/${total}`;
    const secondary = `${modeLine}\nMAP ${this.state.mapId}   PACE ${this.state.rules.pacePresetId.toUpperCase()}\nRANGE ${self.blastRange}   CORES ${self.coreCapacity}   SPEED ${self.speedTier}`;
    const context = this.state.rules.gameModeId === "grid-control"
      ? "ONLINE // GRID CONTROL"
      : this.state.rules.gameModeId === "core-rush"
        ? "ONLINE // CORE RUSH"
        : this.state.rules.gameModeId === "classic-team-deathmatch"
          ? "ONLINE // CLASSIC TEAM DEATHMATCH"
          : "ONLINE // CLASSIC DEATHMATCH";
    this.hud.show(
      context,
      primary,
      secondary,
      "TAP WASD / ARROWS  MOVE 1 TILE\nSPACE  PLACE CORE\nESC  LOBBY",
      suddenDeath ? "danger" : "normal",
      playingHudDetails(this.state, selfId, self, alive)
    );
  }
}
