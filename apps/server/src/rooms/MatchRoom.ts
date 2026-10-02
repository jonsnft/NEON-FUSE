import { Client, Room } from "colyseus";
import {
  PROTOCOL_VERSION,
  createOfficialArena,
  normalizeOfficialMapId,
  isClientIntent,
  playerById,
  resolveRound,
  tickSimulation,
  type GameState,
  type MatchSnapshot,
  type PlayerPresentation,
  type OfficialMapId
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

export class MatchRoom extends Room {
  maxClients = HARD_MAX_PLAYERS;

  private game: GameState | null = null;
  private readonly lastSeq = new Map<string, number>();
  private readonly readyIds = new Set<string>();
  private readonly rematchIds = new Set<string>();
  private readonly platform = createPlatformServices();
  private readonly presentations = new Map<string, PlayerPresentation>();
  private readonly subjectIds = new Map<string, string>();
  private mapId: OfficialMapId = "grid-zero";

  onCreate(options: Record<string, unknown> = {}): void {
    this.maxClients = clampMaxPlayers(options.maxPlayers);
    this.mapId = normalizeOfficialMapId(options.mapId);

    this.onMessage("intent", (client, payload: unknown) => {
      if (!isClientIntent(payload)) return;

      if (payload.type === "match.ready") {
        if (this.game) return;
        if (payload.ready) this.readyIds.add(client.sessionId);
        else this.readyIds.delete(client.sessionId);
        this.tryStartRound();
        this.broadcastWaiting();
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
          playerCount: this.game.players.length
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
    this.presentations.delete(client.sessionId);
    const subjectId = this.subjectIds.get(client.sessionId);
    if (subjectId) void this.platform.telemetry.track({ type: "player.left", subjectId });
    this.subjectIds.delete(client.sessionId);

    if (this.game?.phase === "playing") {
      const player = playerById(this.game, client.sessionId);
      if (player?.alive) {
        player.alive = false;
        resolveRound(this.game);
      }
      this.broadcastSnapshot();
    } else if (this.game?.phase === "finished") {
      const remainingIds = idsExcluding(
        this.clients.map((connected) => connected.sessionId),
        client.sessionId
      );
      if (remainingIds.length < MIN_PLAYERS) {
        this.resetToWaiting();
      } else {
        this.tryStartRematch(remainingIds);
        this.broadcastSnapshot();
      }
    } else {
      const remainingIds = idsExcluding(
        this.clients.map((connected) => connected.sessionId),
        client.sessionId
      );
      this.broadcastWaiting(remainingIds.length);
    }

    void this.refreshMetadata();
  }

  private tryStartRound(): void {
    if (this.game || this.clients.length < MIN_PLAYERS) return;
    const ids = this.clients.map((client) => client.sessionId);
    if (!everyConnectedHasVoted(ids, this.readyIds)) return;

    this.game = createOfficialArena(this.mapId, ids);
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

    this.game = createOfficialArena(this.mapId, ids);
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
      maxPlayers: this.maxClients,
      readyPlayerIds: [...this.readyIds]
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
        maxPlayers: this.maxClients,
        readyPlayerIds: [...this.readyIds]
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
      maxPlayers: this.maxClients,
      connectedPlayers: this.clients.length,
      readyPlayers: this.readyIds.size,
      mapId: this.mapId
    });
  }
}
