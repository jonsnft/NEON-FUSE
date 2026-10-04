import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { PROTOCOL_VERSION, type GameState, type LobbyConfig } from "@neon-fuse/shared";
import { server } from "../src/app.config";

type InspectableMatchRoom = {
  game: GameState | null;
  creatorPlayerId: string | null;
  readyIds: Set<string>;
  config: LobbyConfig;
  maxClients: number;
};

async function waitUntil(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for server room state");
}

describe("authoritative multiplayer runtime", () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot(server);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  beforeEach(async () => {
    await colyseus.cleanup();
  });

  it("requires creator authorization, propagates game mode, and resets ready votes after config changes", async () => {
    const room = await colyseus.createRoom("match", { maxPlayers: 8 });
    const inspectableRoom = room as unknown as InspectableMatchRoom;
    const creator = await colyseus.connectTo(room);
    const player2 = await colyseus.connectTo(room);

    expect(room.maxClients).toBe(8);
    expect(inspectableRoom.creatorPlayerId).toBe(creator.sessionId);
    expect(inspectableRoom.config.mapId).toBe("grid-zero");
    expect(inspectableRoom.config.gameModeId).toBe("survival");
    expect(inspectableRoom.config.pacePresetId).toBe("standard");
    expect(inspectableRoom.game).toBeNull();

    player2.send("lobby.configure", {
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: { gameModeId: "core-rush", pacePresetId: "tactical" }
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(inspectableRoom.config.gameModeId).toBe("survival");
    expect(inspectableRoom.config.pacePresetId).toBe("standard");

    creator.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    player2.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    await waitUntil(() => inspectableRoom.readyIds.size === 2);

    creator.send("lobby.configure", {
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: {
        maxPlayers: 4,
        mapId: "data-cross",
        gameModeId: "core-rush",
        itemPresetId: "no-speed",
        modifierPresetId: "no-sudden-death",
        pacePresetId: "tactical"
      }
    });

    await waitUntil(() => inspectableRoom.config.gameModeId === "core-rush");
    expect(inspectableRoom.maxClients).toBe(4);
    expect(inspectableRoom.config).toEqual({
      maxPlayers: 4,
      mapId: "data-cross",
      gameModeId: "core-rush",
      itemPresetId: "no-speed",
      modifierPresetId: "no-sudden-death",
      pacePresetId: "tactical"
    });
    expect(inspectableRoom.readyIds.size).toBe(0);

    creator.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    player2.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    await waitUntil(() => inspectableRoom.readyIds.size === 2);

    player2.send("intent", {
      type: "match.start",
      version: PROTOCOL_VERSION
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(inspectableRoom.game).toBeNull();

    creator.send("intent", {
      type: "match.start",
      version: PROTOCOL_VERSION
    });
    await waitUntil(() => inspectableRoom.game?.phase === "playing");

    expect(inspectableRoom.game?.mapId).toBe("data-cross");
    expect(inspectableRoom.game?.rules).toEqual({
      gameModeId: "core-rush",
      itemPresetId: "no-speed",
      modifierPresetId: "no-sudden-death",
      pacePresetId: "tactical"
    });
    expect(inspectableRoom.game?.roundDurationMs).toBe(180_000);
    expect(inspectableRoom.game?.pickups.some((pickup) => pickup.kind === "speed")).toBe(false);
    expect(inspectableRoom.game?.players).toHaveLength(2);

    await creator.leave(true);
    await player2.leave(true);
  });
});
