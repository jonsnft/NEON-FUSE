import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { PROTOCOL_VERSION, type MatchSnapshot } from "@neon-fuse/shared";
import { server } from "../src/app.config";

async function waitForStatus(
  client: { waitForMessage(type: string): Promise<unknown> },
  status: MatchSnapshot["status"]
): Promise<MatchSnapshot> {
  for (let i = 0; i < 12; i++) {
    const snapshot = await client.waitForMessage("snapshot") as MatchSnapshot;
    if (snapshot.status === status) return snapshot;
  }
  throw new Error(`Did not receive match snapshot status: ${status}`);
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

    const allReadySnapshot = await waitForStatus(creator, "waiting");
    expect(allReadySnapshot.status).toBe("waiting");
    if (allReadySnapshot.status === "waiting") {
      expect(allReadySnapshot.mapId).toBe("grid-zero");
      expect(allReadySnapshot.creatorPlayerId).toBe(creator.sessionId);
      expect(allReadySnapshot.readyPlayerIds).toEqual(
        expect.arrayContaining([creator.sessionId, player2.sessionId])
      );
    }

    player2.send("intent", {
      type: "match.start",
      version: PROTOCOL_VERSION
    });

    const rejectedStartSnapshot = await waitForStatus(creator, "waiting");
    expect(rejectedStartSnapshot.status).toBe("waiting");

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
