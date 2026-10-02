import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { PROTOCOL_VERSION, type MatchSnapshot } from "@neon-fuse/shared";
import { server } from "../src/app.config";

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

  it("boots a 2-client match and starts only after both clients are ready", async () => {
    const room = await colyseus.createRoom("match", { maxPlayers: 4 });
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    expect(room.maxClients).toBe(4);
    expect(client1.sessionId).toBeTruthy();
    expect(client2.sessionId).toBeTruthy();

    const waiting = client1.waitForMessage("snapshot") as Promise<MatchSnapshot>;
    client1.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    const waitingSnapshot = await waiting;
    expect(waitingSnapshot.status).toBe("waiting");

    const playing = client1.waitForMessage("snapshot") as Promise<MatchSnapshot>;
    client2.send("intent", {
      type: "match.ready",
      version: PROTOCOL_VERSION,
      ready: true
    });
    const playingSnapshot = await playing;

    expect(playingSnapshot.status).toBe("playing");
    if (playingSnapshot.status === "playing") {
      expect(playingSnapshot.game.players).toHaveLength(2);
      expect(Object.keys(playingSnapshot.presentations)).toHaveLength(2);
    }
  });
});
