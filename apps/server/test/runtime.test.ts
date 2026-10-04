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
    expect(inspectableRoom.config.gameModeId).toBe("classic-deathmatch");
    expect(inspectableRoom.config.botCount).toBe(0);
    expect(inspectableRoom.config.botDifficulty).toBe("normal");
    expect(inspectableRoom.config.pacePresetId).toBe("standard");
    expect(inspectableRoom.game).toBeNull();

    player2.send("lobby.configure", {
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: { gameModeId: "core-rush", pacePresetId: "tactical" }
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(inspectableRoom.config.gameModeId).toBe("classic-deathmatch");
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
        botCount: 1,
        botDifficulty: "hard",
        gameModeId: "core-rush",
        itemPresetId: "no-speed",
        modifierPresetId: "no-sudden-death",
        pacePresetId: "tactical"
      }
    });

    await waitUntil(() => inspectableRoom.config.gameModeId === "core-rush");
    expect(inspectableRoom.maxClients).toBe(3);
    expect(inspectableRoom.config).toEqual({
      maxPlayers: 4,
      mapId: "data-cross",
      botCount: 1,
      botDifficulty: "hard",
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
    expect(inspectableRoom.game?.players).toHaveLength(3);
    expect(inspectableRoom.game?.players.some((player) => player.id === "bot-1")).toBe(true);

    await creator.leave(true);
    await player2.leave(true);
  });

  it("allows a solo creator to start against configured AI bots", async () => {
    const room = await colyseus.createRoom("match", { maxPlayers: 8 });
    const inspectableRoom = room as unknown as InspectableMatchRoom;
    const creator = await colyseus.connectTo(room);

    creator.send("lobby.configure", {
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: { botCount: 1, botDifficulty: "nightmare" }
    });
    await waitUntil(() => inspectableRoom.config.botCount === 1);
    expect(inspectableRoom.maxClients).toBe(7);

    creator.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    await waitUntil(() => inspectableRoom.readyIds.has(creator.sessionId));

    creator.send("intent", {
      type: "match.start",
      version: PROTOCOL_VERSION
    });
    await waitUntil(() => inspectableRoom.game?.phase === "playing");

    expect(inspectableRoom.game?.players).toHaveLength(2);
    expect(inspectableRoom.game?.players.map((player) => player.id)).toContain("bot-1");
    expect(inspectableRoom.config.botDifficulty).toBe("nightmare");

    await creator.leave(true);
  });
});
