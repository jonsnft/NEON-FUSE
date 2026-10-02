import { Client, type Room } from "@colyseus/sdk";
import type { ClientIntent, MatchSnapshot } from "@neon-fuse/shared";

type SnapshotHandler = (snapshot: MatchSnapshot) => void;
type StatusHandler = (status: string) => void;

export class MatchConnection {
  private readonly client: Client;
  private room: Room | null = null;
  private snapshotHandler: SnapshotHandler | null = null;
  private statusHandler: StatusHandler | null = null;
  private reconnecting = false;

  constructor(endpoint = import.meta.env.VITE_GAME_SERVER_URL ?? "http://localhost:2567") {
    this.client = new Client(endpoint);
  }

  get playerId(): string | null {
    return this.room?.sessionId ?? null;
  }

  async connect(onSnapshot: SnapshotHandler, onStatus: StatusHandler): Promise<void> {
    this.snapshotHandler = onSnapshot;
    this.statusHandler = onStatus;
    onStatus("CONNECTING");

    const room = await this.client.joinOrCreate("match");
    this.bindRoom(room);
    onStatus("CONNECTED");
  }

  send(intent: ClientIntent): void {
    this.room?.send("intent", intent);
  }

  private bindRoom(room: Room): void {
    this.room = room;
    const reconnectionToken = room.reconnectionToken;

    room.onMessage("snapshot", (snapshot: MatchSnapshot) => {
      this.snapshotHandler?.(snapshot);
    });

    room.onError((code, message) => {
      this.statusHandler?.(`NETWORK ERROR ${code}: ${message}`);
    });

    room.onLeave((code) => {
      if (code === 1000) {
        this.statusHandler?.("DISCONNECTED");
        return;
      }
      void this.tryReconnect(reconnectionToken);
    });
  }

  private async tryReconnect(token: string): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.statusHandler?.("RECONNECTING");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const room = await this.client.reconnect(token);
        this.bindRoom(room);
        this.statusHandler?.("RECONNECTED");
        this.reconnecting = false;
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    this.reconnecting = false;
    this.statusHandler?.("RECONNECT FAILED");
  }
}
