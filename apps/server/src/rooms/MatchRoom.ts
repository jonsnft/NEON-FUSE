import { Client, Room } from "colyseus";
import {
  CHAT_MIN_INTERVAL_MS,
  DEFAULT_LOBBY_CONFIG,
  PROTOCOL_VERSION,
  applyLobbyConfigPatch,
  createOfficialArena,
  isChatSend,
  isClientIntent,
  isLobbyConfigureRequest,
  normalizeChatText,
  normalizeOfficialMapId,
  playerById,
  resolveRound,
  tickSimulation,
  type ChatMessage,
  type GameRules,
  type GameState,
  type LobbyConfig,
  type MatchSnapshot,
  type PlayerPresentation
} from "@neon-fuse/shared";
import { applyClientIntent } from "../intent";
import {
  HARD_MAX_PLAYERS,
  MIN_PLAYERS,
  clampMaxPlayers,
  everyConnectedHasVoted,
  idsExcluding
} from "../lifecycle";
import { createPlatformServices } from "../platform/createPlatformServices";

const TICK_MS = 50;

const isRoundFinished = (game: GameState): boolean => game.phase === "finished";

const sameConfig = (a: LobbyConfig, b: LobbyConfig): boolean =>
  a.maxPlayers === b.maxPlayers &&
  a.mapId === b.mapId &&
  a.itemPresetId === b.itemPresetId &&
  a.modifierPresetId === b.modifierPresetId &&
  a.pacePresetId === b.pacePresetId;

const totalPickupsCollected = (game: GameState): number =>
  game.metrics.players.reduce(
    (sum, player) => sum + player.pickupsCollected.range + player.pickupsCollected.capacity + player.pickupsCollected.speed,
    0
  );

export class MatchRoom extends Room {
  maxClients = HARD_MAX_PLAYERS;

  private game: GameState | null = null;
  private readonly lastSeq = new Map<string, number>();
  private readonly readyIds = new Set<string>();
  private readonly rematchIds = new Set<string>();
  private readonly lastChatAt = new Map<string, number>();
  private readonly platform = createPlatformServices();
  private readonly presentations = new Map<string, PlayerPresentation>();
  private readonly subjectIds = new Map<string, string>();
  private config: LobbyConfig = { ...DEFAULT_LOBBY_CONFIG };
  private creatorPlayerId: string | null = null;

  onCreate(options: Record<string, unknown> = {}): void {
    this.config = {
      ...DEFAULT_LOBBY_CONFIG,
      maxPlayers: clampMaxPlayers(options.maxPlayers),
      mapId: normalizeOfficialMapId(options.mapId)
    };
    this.maxClients = this.config.maxPlayers;

    this.onMessage("chat.send", (client, payload: unknown) => {
      if (this.game || !isChatSend(payload)) return;

      const now = Date.now();
      const lastSentAt = this.lastChatAt.get(client.sessionId) ?? Number.NEGATIVE_INFINITY;
      if (now - lastSentAt < CHAT_MIN_INTERVAL_MS) return;

      const text = normalizeChatText(payload.text);
      if (!text) return;

      this.lastChatAt.set(client.sessionId, now);
      const message: ChatMessage = {
        type: "chat.message",
        version: PROTOCOL_VERSION,
        senderId: client.sessionId,
        text,
        sentAtMs: now
      };
      this.broadcast("chat.message", message);
    });

    this.onMessage("lobby.configure", (client, payload: unknown) => {
      if (this.game || client.sessionId !== this.creatorPlayerId || !isLobbyConfigureRequest(payload)) {
        return;
      }

      const next = applyLobbyConfigPatch(this.config, payload.patch, this.clients.length);
      if (!next || sameConfig(next, this.config)) return;

      this.config = next;
      this.maxClients = next.maxPlayers;
      this.readyIds.clear();
      this.broadcastWaiting();
      void this.refreshMetadata();
    });

    this.onMessage("intent", (client, payload: unknown) => {
      if (!isClientIntent(payload)) return;

      if (payload.type === "match.ready") {
        if (this.game) return;
        if (payload.ready) this.readyIds.add(client.sessionId);
        else this.readyIds.delete(client.sessionId);
        this.broadcastWaiting();
        void this.refreshMetadata();
        return;
      }

      if (payload.type === "match.start") {
        if (this.game) return;
        this.tryStartRound(client.sessionId);
        if (!this.game) this.broadcastWaiting();
        void this.refreshMetadata();
        return;
      }

      if (payload.type === "match.rematch") {
        if (this.game?.phase !== "finished") return;
        this.rematchIds.add(client.sessionId);
        this.tryStartRematch();
        this.broadcastSnapshot();
        void this.refreshMetadata();
        return;
      }

      if (!this.game) return;
      const changed = applyClientIntent(this.game, client.sessionId, payload, this.lastSeq);
      if (changed) this.broadcastSnapshot();
    });

    this.setSimulationInterval((deltaTime) => {
      if (!this.game || this.game.phase !== "playing") return;
      const wasPlaying = this.game.phase === "playing";
      tickSimulation(this.game, Math.min(deltaTime, 100));
      this.broadcastSnapshot();
      if (wasPlaying && isRoundFinished(this.game)) {
        void this.platform.telemetry.track({
          type: "match.finished",
          winnerSubjectId: this.game.winnerId
            ? this.subjectIds.get(this.game.winnerId) ?? null
            : null,
          playerCount: this.game.players.length,
          metrics: {
            durationMs: this.game.elapsedMs,
            totalCorePlacements: this.game.metrics.players.reduce((sum, player) => sum + player.coresPlaced, 0),
            totalPickupsCollected: totalPickupsCollected(this.game),
            chainDetonations: this.game.metrics.chainDetonations,
            reachedSuddenDeath: this.game.metrics.reachedSuddenDeath,
            eliminationTimesMs: this.game.metrics.players.map((player) => player.eliminatedAtMs),
            spawnEliminations: this.game.metrics.players.map((player) => ({
              spawnIndex: player.spawnIndex,
              eliminatedAtMs: player.eliminatedAtMs
            }))
          }
        });
        void this.refreshMetadata();
      }
    }, TICK_MS);

    void this.refreshMetadata();
  }

  async onJoin(client: Client): Promise<void> {
    this.lastSeq.set(client.sessionId, -1);
    this.readyIds.delete(client.sessionId);
    this.rematchIds.delete(client.sessionId);
    if (!this.creatorPlayerId && !this.game) this.creatorPlayerId = client.sessionId;

    const subject = await this.platform.identity.resolveSubject(client.sessionId);
    this.subjectIds.set(client.sessionId, subject.subjectId);
    this.presentations.set(
      client.sessionId,
      (await this.platform.entitlements.getEntitlements(
        subject.subjectId,
        this.clients.findIndex((c) => c.sessionId === client.sessionId)
      )).presentation
    );
    void this.platform.telemetry.track({ type: "player.joined", subjectId: subject.subjectId });

    if (this.game) this.sendSnapshot(client);
    else this.broadcastWaiting();

    void this.refreshMetadata();
  }

  onDrop(client: Client): void {
    this.allowReconnection(client, 10);
  }

  onReconnect(client: Client): void {
    if (this.game) this.sendSnapshot(client);
    else this.broadcastWaiting();
  }

  onLeave(client: Client): void {
    this.lastSeq.delete(client.sessionId);
    this.readyIds.delete(client.sessionId);
    this.rematchIds.delete(client.sessionId);
    this.lastChatAt.delete(client.sessionId);
    this.presentations.delete(client.sessionId);
    const subjectId = this.subjectIds.get(client.sessionId);
    if (subjectId) void this.platform.telemetry.track({ type: "player.left", subjectId });
    this.subjectIds.delete(client.sessionId);

    const remainingIds = idsExcluding(
      this.clients.map((connected) => connected.sessionId),
      client.sessionId
    );
    if (client.sessionId === this.creatorPlayerId) {
      this.creatorPlayerId = remainingIds[0] ?? null;
    }

    if (this.game?.phase === "playing") {
      const player = playerById(this.game, client.sessionId);
      if (player?.alive) {
        player.alive = false;
        resolveRound(this.game);
      }
      this.broadcastSnapshot();
    } else if (this.game?.phase === "finished") {
      if (remainingIds.length < MIN_PLAYERS) {
        this.resetToWaiting();
      } else {
        this.tryStartRematch(remainingIds);
        this.broadcastSnapshot();
      }
    } else {
      this.broadcastWaiting(remainingIds.length);
    }

    void this.refreshMetadata();
  }

  private gameRules(): GameRules {
    return {
      itemPresetId: this.config.itemPresetId,
      modifierPresetId: this.config.modifierPresetId,
      pacePresetId: this.config.pacePresetId
    };
  }

  private tryStartRound(requesterId: string): void {
    if (this.game || requesterId !== this.creatorPlayerId || this.clients.length < MIN_PLAYERS) return;
    const ids = this.clients.map((client) => client.sessionId);
    if (!everyConnectedHasVoted(ids, this.readyIds)) return;

    this.game = createOfficialArena(this.config.mapId, ids, this.gameRules());
    this.rematchIds.clear();
    this.readyIds.clear();
    for (const id of ids) this.lastSeq.set(id, -1);
    void this.lock();
    void this.platform.telemetry.track({ type: "match.started", playerCount: ids.length, rematch: false });
    this.broadcastSnapshot();
  }

  private tryStartRematch(roster?: string[]): void {
    if (this.game?.phase !== "finished") return;
    const ids = roster ?? this.clients.map((client) => client.sessionId);
    if (!everyConnectedHasVoted(ids, this.rematchIds)) return;

    this.game = createOfficialArena(this.config.mapId, ids, this.gameRules());
    this.rematchIds.clear();
    for (const id of ids) this.lastSeq.set(id, -1);
    void this.lock();
    void this.platform.telemetry.track({ type: "match.started", playerCount: ids.length, rematch: true });
    this.broadcastSnapshot();
  }

  private resetToWaiting(): void {
    this.game = null;
    this.readyIds.clear();
    this.rematchIds.clear();
    if (!this.creatorPlayerId) this.creatorPlayerId = this.clients[0]?.sessionId ?? null;
    void this.unlock();
    this.broadcastWaiting();
  }

  private broadcastWaiting(connectedPlayers = this.clients.length): void {
    if (this.game) return;
    const snapshot: MatchSnapshot = {
      type: "match.snapshot",
      version: PROTOCOL_VERSION,
      status: "waiting",
      connectedPlayers,
      requiredPlayers: MIN_PLAYERS,
      readyPlayerIds: [...this.readyIds],
      creatorPlayerId: this.creatorPlayerId,
      config: { ...this.config }
    };
    this.broadcast("snapshot", snapshot);
  }

  private broadcastSnapshot(): void {
    if (!this.game) return;
    const snapshot: MatchSnapshot =
      this.game.phase === "finished"
        ? {
            type: "match.snapshot",
            version: PROTOCOL_VERSION,
            status: "finished",
            game: this.game,
            presentations: this.presentationRecord(),
            rematchPlayerIds: [...this.rematchIds]
          }
        : {
            type: "match.snapshot",
            version: PROTOCOL_VERSION,
            status: "playing",
            game: this.game,
            presentations: this.presentationRecord()
          };
    this.broadcast("snapshot", snapshot);
  }

  private sendSnapshot(client: Client): void {
    if (!this.game) {
      const snapshot: MatchSnapshot = {
        type: "match.snapshot",
        version: PROTOCOL_VERSION,
        status: "waiting",
        connectedPlayers: this.clients.length,
        requiredPlayers: MIN_PLAYERS,
        readyPlayerIds: [...this.readyIds],
        creatorPlayerId: this.creatorPlayerId,
        config: { ...this.config }
      };
      client.send("snapshot", snapshot);
      return;
    }

    const snapshot: MatchSnapshot =
      this.game.phase === "finished"
        ? {
            type: "match.snapshot",
            version: PROTOCOL_VERSION,
            status: "finished",
            game: this.game,
            presentations: this.presentationRecord(),
            rematchPlayerIds: [...this.rematchIds]
          }
        : {
            type: "match.snapshot",
            version: PROTOCOL_VERSION,
            status: "playing",
            game: this.game,
            presentations: this.presentationRecord()
          };
    client.send("snapshot", snapshot);
  }

  private presentationRecord(): Record<string, PlayerPresentation> {
    return Object.fromEntries(this.presentations.entries());
  }

  private async refreshMetadata(): Promise<void> {
    await this.setMetadata({
      phase: !this.game ? "waiting" : this.game.phase,
      maxPlayers: this.config.maxPlayers,
      connectedPlayers: this.clients.length,
      readyPlayers: this.readyIds.size,
      mapId: this.config.mapId,
      itemPresetId: this.config.itemPresetId,
      modifierPresetId: this.config.modifierPresetId,
      pacePresetId: this.config.pacePresetId
    });
  }
}
