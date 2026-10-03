import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { PROTOCOL_VERSION, type GameState, type MatchSnapshot } from "@neon-fuse/shared";
import { server } from "../src/app.config";

type TestClient = { waitForMessage(type: string): Promise<unknown> };
type InspectableMatchRoom = { game: GameState | null };

async function waitForWaiting(
  client: TestClient,
  predicate: (snapshot: Extract<MatchSnapshot, { status: "waiting" }>) => boolean
): Promise<Extract<MatchSnapshot, { status: "waiting" }>> {
  for (let i = 0; i < 16; i++) {
    const snapshot = await client.waitForMessage("snapshot") as MatchSnapshot;
    if (snapshot.status === "waiting" && predicate(snapshot)) return snapshot;
  }
  throw new Error("Did not receive expected waiting snapshot");
}

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
    expect(creator.sessionId).toBeTruthy();
    expect(player2.sessionId).toBeTruthy();

    const allReadyPromise = waitForWaiting(
      creator,
      (snapshot) =>
        snapshot.readyPlayerIds.includes(creator.sessionId) &&
        snapshot.readyPlayerIds.includes(player2.sessionId)
    );

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

    const allReadySnapshot = await allReadyPromise;
    expect(allReadySnapshot.mapId).toBe("grid-zero");
    expect(allReadySnapshot.creatorPlayerId).toBe(creator.sessionId);
    expect(allReadySnapshot.readyPlayerIds).toHaveLength(2);
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
  });
});
