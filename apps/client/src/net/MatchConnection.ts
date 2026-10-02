import type { Room } from "@colyseus/sdk";
import type { ClientIntent, MatchSnapshot, OfficialMapId } from "@neon-fuse/shared";
import { networkClient } from "./NetworkSession";

type SnapshotHandler = (snapshot: MatchSnapshot) => void;
type StatusHandler = (status: string) => void;

export class MatchConnection {
  private room: Room | null = null;
  private snapshotHandler: SnapshotHandler | null = null;
  private statusHandler: StatusHandler | null = null;
  private reconnecting = false;
  private manualLeave = false;

  get playerId(): string | null {
    return this.room?.sessionId ?? null;
  }

  async connect(
    onSnapshot: SnapshotHandler,
    onStatus: StatusHandler,
    roomId?: string,
    mapId: OfficialMapId = "grid-zero"
  ): Promise<void> {
    this.snapshotHandler = onSnapshot;
    this.statusHandler = onStatus;
    this.manualLeave = false;
    onStatus("CONNECTING");

    const room = roomId
      ? await networkClient.joinById(roomId)
      : await networkClient.joinOrCreate("match", { maxPlayers: 8, mapId });

    this.bindRoom(room);
    onStatus("CONNECTED");
  }

  send(intent: ClientIntent): void {
    this.room?.send("intent", intent);
  }

  async disconnect(): Promise<void> {
    this.manualLeave = true;
    this.reconnecting = false;

    const room = this.room;
    this.room = null;

    try {
      if (room) await room.leave(true);
    } finally {
      this.snapshotHandler = null;
      this.statusHandler = null;
    }
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
      if (this.manualLeave) return;

      this.room = null;
      if (code === 1000) {
        this.statusHandler?.("DISCONNECTED");
        return;
      }

      void this.tryReconnect(reconnectionToken);
    });
  }

  private async tryReconnect(token: string): Promise<void> {
    if (this.reconnecting || this.manualLeave) return;
    this.reconnecting = true;
    this.statusHandler?.("RECONNECTING");

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (this.manualLeave) break;
      try {
        const room = await networkClient.reconnect(token);
        if (this.manualLeave) {
          await room.leave(true);
          break;
        }
        this.bindRoom(room);
        this.statusHandler?.("RECONNECTED");
        this.reconnecting = false;
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    this.reconnecting = false;
    if (!this.manualLeave) this.statusHandler?.("RECONNECT FAILED");
  }
}
