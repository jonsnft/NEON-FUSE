import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { PROTOCOL_VERSION, type GameState } from "@neon-fuse/shared";
import { server } from "../src/app.config";

type InspectableMatchRoom = {
  game: GameState | null;
  creatorPlayerId: string | null;
  readyIds: Set<string>;
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

  it("requires creator authorization after every connected player is ready", async () => {
    const room = await colyseus.createRoom("match", {
      maxPlayers: 4,
      mapId: "grid-zero"
    });
    const inspectableRoom = room as unknown as InspectableMatchRoom;
    const creator = await colyseus.connectTo(room);
    const player2 = await colyseus.connectTo(room);

    expect(room.maxClients).toBe(4);
    expect(inspectableRoom.creatorPlayerId).toBe(creator.sessionId);
    expect(inspectableRoom.game).toBeNull();

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
    expect(inspectableRoom.readyIds.has(creator.sessionId)).toBe(true);
    expect(inspectableRoom.readyIds.has(player2.sessionId)).toBe(true);
    expect(inspectableRoom.game).toBeNull();

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

    expect(inspectableRoom.game?.mapId).toBe("grid-zero");
    expect(inspectableRoom.game?.players).toHaveLength(2);

    await creator.leave(true);
    await player2.leave(true);
  });
});
