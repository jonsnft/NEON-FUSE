import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { PROTOCOL_VERSION, type MatchSnapshot } from "@neon-fuse/shared";
import { server } from "../src/app.config";

type TestClient = { waitForMessage(type: string): Promise<unknown> };

async function waitForStatus(
  client: TestClient,
  status: MatchSnapshot["status"]
): Promise<MatchSnapshot> {
  for (let i = 0; i < 16; i++) {
    const snapshot = await client.waitForMessage("snapshot") as MatchSnapshot;
    if (snapshot.status === status) return snapshot;
  }
  throw new Error(`Did not receive match snapshot status: ${status}`);
}

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
    const creator = await colyseus.connectTo(room);
    const player2 = await colyseus.connectTo(room);

    expect(room.maxClients).toBe(4);
    expect(creator.sessionId).toBeTruthy();
    expect(player2.sessionId).toBeTruthy();

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

    const allReadySnapshot = await waitForWaiting(
      creator,
      (snapshot) =>
        snapshot.readyPlayerIds.includes(creator.sessionId) &&
        snapshot.readyPlayerIds.includes(player2.sessionId)
    );

    expect(allReadySnapshot.mapId).toBe("grid-zero");
    expect(allReadySnapshot.creatorPlayerId).toBe(creator.sessionId);
    expect(allReadySnapshot.readyPlayerIds).toHaveLength(2);

    player2.send("intent", {
      type: "match.start",
      version: PROTOCOL_VERSION
    });

    const rejectedStartSnapshot = await waitForWaiting(
      creator,
      (snapshot) => snapshot.readyPlayerIds.length === 2
    );
    expect(rejectedStartSnapshot.creatorPlayerId).toBe(creator.sessionId);

    creator.send("intent", {
      type: "match.start",
      version: PROTOCOL_VERSION
    });

    const playingSnapshot = await waitForStatus(creator, "playing");
    expect(playingSnapshot.status).toBe("playing");
    if (playingSnapshot.status === "playing") {
      expect(playingSnapshot.game.mapId).toBe("grid-zero");
      expect(playingSnapshot.game.players).toHaveLength(2);
      expect(Object.keys(playingSnapshot.presentations)).toHaveLength(2);
    }
  });
});
