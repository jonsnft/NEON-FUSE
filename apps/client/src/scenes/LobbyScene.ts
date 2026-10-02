import { GameObjects, Input, Scene } from "phaser";
import {
  OFFICIAL_MAP_IDS,
  OFFICIAL_MAPS,
  type OfficialMapId
} from "@neon-fuse/shared";
import { LobbyConnection, type LobbyRoomInfo } from "../net/LobbyConnection";

export class LobbyScene extends Scene {
  private rooms: LobbyRoomInfo[] = [];
  private lobby = new LobbyConnection();
  private title!: GameObjects.Text;
  private list!: GameObjects.Text;
  private status!: GameObjects.Text;
  private keys!: Record<string, Input.Keyboard.Key>;
  private selectedMapIndex = 0;
  private connected = false;

  constructor() {
    super("lobby");
  }

  create(): void {
    this.title = this.add.text(28, 28, "NEON FUSE // NETWORK LOBBY", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#53f3ff"
    });

    this.list = this.add.text(28, 92, "", {
      fontFamily: "monospace",
      fontSize: "17px",
      color: "#dff",
      lineSpacing: 9
    });

    this.status = this.add.text(28, 560, "CONNECTING TO LOBBY...", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#e9ff70"
    });

    if (!this.input.keyboard) throw new Error("Keyboard input unavailable");
    this.keys = this.input.keyboard.addKeys({
      quick: Input.Keyboard.KeyCodes.Q,
      map: Input.Keyboard.KeyCodes.M,
      one: Input.Keyboard.KeyCodes.ONE,
      two: Input.Keyboard.KeyCodes.TWO,
      three: Input.Keyboard.KeyCodes.THREE,
      four: Input.Keyboard.KeyCodes.FOUR,
      five: Input.Keyboard.KeyCodes.FIVE,
      six: Input.Keyboard.KeyCodes.SIX,
      seven: Input.Keyboard.KeyCodes.SEVEN,
      store: Input.Keyboard.KeyCodes.S
    }) as Record<string, Input.Keyboard.Key>;

    void this.lobby.connect((rooms) => {
      this.rooms = rooms
        .filter((room) => !room.locked)
        .slice(0, 7);
      this.renderRooms();
    }).then(() => {
      this.connected = true;
      this.renderHelp();
    }).catch((error: unknown) => {
      this.connected = false;
      this.status.setText(error instanceof Error ? error.message : "LOBBY CONNECTION FAILED");
    });

    this.events.once("shutdown", () => void this.lobby.disconnect());
  }

  update(): void {
    if (Input.Keyboard.JustDown(this.keys.store)) {
      this.scene.start("store-preview");
      return;
    }

    if (Input.Keyboard.JustDown(this.keys.map)) {
      this.selectedMapIndex = (this.selectedMapIndex + 1) % OFFICIAL_MAP_IDS.length;
      this.renderHelp();
      return;
    }

    if (Input.Keyboard.JustDown(this.keys.quick)) {
      this.startMatch();
      return;
    }

    const numberKeys = ["one","two","three","four","five","six","seven"] as const;
    for (let i = 0; i < numberKeys.length; i++) {
      if (Input.Keyboard.JustDown(this.keys[numberKeys[i]]) && this.rooms[i]) {
        this.startMatch(this.rooms[i].roomId);
        return;
      }
    }
  }

  private get selectedMapId(): OfficialMapId {
    return OFFICIAL_MAP_IDS[this.selectedMapIndex];
  }

  private startMatch(roomId?: string): void {
    this.scene.start("online-game", {
      roomId,
      mapId: this.selectedMapId
    });
  }

  private renderHelp(): void {
    if (!this.connected) return;
    const map = OFFICIAL_MAPS[this.selectedMapId];
    this.status.setText(
      `Q QUICK MATCH // 1-7 JOIN ROOM // M MAP: ${map.displayName.toUpperCase()} // S ITEMS`
    );
  }

  private renderRooms(): void {
    if (this.rooms.length === 0) {
      this.list.setText("NO OPEN ROOMS\n\nPRESS Q TO CREATE / QUICK-JOIN A MATCH");
      return;
    }

    this.list.setText(
      this.rooms.map((room, index) => {
        const phase = room.metadata?.phase ?? "waiting";
        const players = room.metadata?.connectedPlayers ?? room.clients;
        const max = room.metadata?.maxPlayers ?? room.maxClients;
        const ready = room.metadata?.readyPlayers ?? 0;
        const map = room.metadata?.mapId ?? "grid-zero";
        return `[${index + 1}] ${room.roomId.slice(0, 8)}  ${phase.toUpperCase()}  ${players}/${max}  READY:${ready}  MAP:${map}`;
      }).join("\n")
    );
  }
}
