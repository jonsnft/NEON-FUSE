import { Client, Room } from "colyseus";
import {
  PROTOCOL_VERSION,
  createArena,
  isClientIntent,
  playerById,
  resolveRound,
  tickSimulation,
  type GameState,
  type MatchSnapshot
} from "@neon-fuse/shared";
import { applyClientIntent } from "../intent";

const REQUIRED_PLAYERS = 2;
const TICK_MS = 50;

export class MatchRoom extends Room {
  maxClients = REQUIRED_PLAYERS;

  private game: GameState | null = null;
  private readonly lastSeq = new Map<string, number>();

  onCreate(): void {
    this.onMessage("intent", (client, payload: unknown) => {
      if (!this.game || !isClientIntent(payload)) return;
      const changed = applyClientIntent(this.game, client.sessionId, payload, this.lastSeq);
      if (changed) this.broadcastSnapshot();
    });

    this.setSimulationInterval((deltaTime) => {
      if (!this.game || this.game.phase !== "playing") return;
      tickSimulation(this.game, Math.min(deltaTime, 100));
      this.broadcastSnapshot();
    }, TICK_MS);
  }

  onJoin(client: Client): void {
    this.lastSeq.set(client.sessionId, -1);

    if (!this.game && this.clients.length >= REQUIRED_PLAYERS) {
      this.game = createArena(this.clients.map((connected) => connected.sessionId));
      this.broadcastSnapshot();
      return;
    }

    if (this.game) {
      this.sendSnapshot(client);
    } else {
      this.broadcastWaiting();
    }
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

    if (this.game?.phase === "playing") {
      const player = playerById(this.game, client.sessionId);
      if (player?.alive) {
        player.alive = false;
        resolveRound(this.game);
      }
      this.broadcastSnapshot();
    } else if (!this.game) {
      this.broadcastWaiting(Math.max(0, this.clients.length - 1));
    }
  }

  private broadcastWaiting(connectedPlayers = this.clients.length): void {
    const snapshot: MatchSnapshot = {
      type: "match.snapshot",
      version: PROTOCOL_VERSION,
      status: "waiting",
      connectedPlayers,
      requiredPlayers: REQUIRED_PLAYERS
    };
    this.broadcast("snapshot", snapshot);
  }

  private broadcastSnapshot(): void {
    if (!this.game) return;
    const snapshot: MatchSnapshot = {
      type: "match.snapshot",
      version: PROTOCOL_VERSION,
      status: this.game.phase,
      game: this.game
    };
    this.broadcast("snapshot", snapshot);
  }

  private sendSnapshot(client: Client): void {
    if (!this.game) return;
    const snapshot: MatchSnapshot = {
      type: "match.snapshot",
      version: PROTOCOL_VERSION,
      status: this.game.phase,
      game: this.game
    };
    client.send("snapshot", snapshot);
  }
}
