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

  it("boots a two-client match and starts only after both clients are ready", async () => {
    const room = await colyseus.createRoom("match", {
      maxPlayers: 4,
      mapId: "grid-zero"
    });
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    expect(room.maxClients).toBe(4);
    expect(client1.sessionId).toBeTruthy();
    expect(client2.sessionId).toBeTruthy();

    client1.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });

    const waitingSnapshot = await waitForStatus(client1, "waiting");
    expect(waitingSnapshot.status).toBe("waiting");
    if (waitingSnapshot.status === "waiting") {
      expect(waitingSnapshot.mapId).toBe("grid-zero");
    }

    client2.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });

    const playingSnapshot = await waitForStatus(client1, "playing");
    expect(playingSnapshot.status).toBe("playing");
    if (playingSnapshot.status === "playing") {
      expect(playingSnapshot.game.mapId).toBe("grid-zero");
      expect(playingSnapshot.game.players).toHaveLength(2);
      expect(Object.keys(playingSnapshot.presentations)).toHaveLength(2);
    }
  });
});
