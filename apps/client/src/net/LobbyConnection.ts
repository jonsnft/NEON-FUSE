import type { Room } from "@colyseus/sdk";
import { networkClient } from "./NetworkSession";

export interface LobbyRoomInfo {
  roomId: string;
  name: string;
  clients: number;
  maxClients: number;
  locked: boolean;
  metadata?: {
    phase?: string;
    maxPlayers?: number;
    connectedPlayers?: number;
    readyPlayers?: number;
  };
}

type RoomsHandler = (rooms: LobbyRoomInfo[]) => void;

export class LobbyConnection {
  private room: Room | null = null;
  private rooms: LobbyRoomInfo[] = [];
  private handler: RoomsHandler | null = null;

  async connect(handler: RoomsHandler): Promise<void> {
    this.handler = handler;
    const room = await networkClient.joinOrCreate("lobby");
    this.room = room;

    room.onMessage("rooms", (rooms: LobbyRoomInfo[]) => {
      this.rooms = rooms.filter((candidate) => candidate.name === "match");
      this.emit();
    });

    room.onMessage("+", ([roomId, info]: [string, LobbyRoomInfo]) => {
      if (info.name !== "match") return;
      const roomInfo = { ...info, roomId };
      const index = this.rooms.findIndex((candidate) => candidate.roomId === roomId);
      if (index >= 0) this.rooms[index] = roomInfo;
      else this.rooms.push(roomInfo);
      this.emit();
    });

    room.onMessage("-", (roomId: string) => {
      this.rooms = this.rooms.filter((candidate) => candidate.roomId !== roomId);
      this.emit();
    });
  }

  async disconnect(): Promise<void> {
    await this.room?.leave();
    this.room = null;
  }

  private emit(): void {
    this.handler?.([...this.rooms]);
  }
}
