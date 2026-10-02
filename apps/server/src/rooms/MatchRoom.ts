import { Client, Room } from "colyseus";
import {
  PROTOCOL_VERSION,
  createArena,
  isClientIntent,
  playerById,
  resolveRound,
  tickSimulation,
  type GameState,
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
import { LocalEntitlementProvider } from "../platform/LocalEntitlementProvider";

const TICK_MS = 50;

const isRoundFinished = (game: GameState): boolean => game.phase === "finished";

export class MatchRoom extends Room {
  maxClients = HARD_MAX_PLAYERS;

  private game: GameState | null = null;
  private readonly lastSeq = new Map<string, number>();
  private readonly readyIds = new Set<string>();
  private readonly rematchIds = new Set<string>();
  private readonly entitlementProvider = new LocalEntitlementProvider();
  private readonly presentations = new Map<string, PlayerPresentation>();

  onCreate(options: Record<string, unknown> = {}): void {
    this.maxClients = clampMaxPlayers(options.maxPlayers);

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
      tickSimulation(this.game, Math.min(deltaTime, 100));
      this.broadcastSnapshot();
      if (isRoundFinished(this.game)) void this.refreshMetadata();
    }, TICK_MS);

    void this.refreshMetadata();
  }

  async onJoin(client: Client): Promise<void> {
    this.lastSeq.set(client.sessionId, -1);
    this.readyIds.delete(client.sessionId);
    this.rematchIds.delete(client.sessionId);
    this.presentations.set(
      client.sessionId,
      (await this.entitlementProvider.getEntitlements(
        client.sessionId,
        this.clients.findIndex((c) => c.sessionId === client.sessionId)
      )).presentation
    );

    if (this.game) this.sendSnapshot(client);
    else this.broadcastWaiting();

    void this.refreshMetadata();
  }

  async onDrop(client: Client): Promise<void> {
    try {
      await this.allowReconnection(client, 10);
    } catch (error) {
      if (error instanceof Error && error.message === "disposing") return;
      throw error;
    }
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

    this.game = createArena(ids);
    this.rematchIds.clear();
    this.readyIds.clear();
    for (const id of ids) this.lastSeq.set(id, -1);
    void this.lock();
    this.broadcastSnapshot();
  }

  private tryStartRematch(roster?: string[]): void {
    if (this.game?.phase !== "finished") return;
    const ids = roster ?? this.clients.map((client) => client.sessionId);
    if (!everyConnectedHasVoted(ids, this.rematchIds)) return;

    this.game = createArena(ids);
    this.rematchIds.clear();
    for (const id of ids) this.lastSeq.set(id, -1);
    void this.lock();
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
      readyPlayers: this.readyIds.size
    });
  }
}
