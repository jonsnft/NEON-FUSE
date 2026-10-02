import { LobbyRoom, defineRoom, defineServer } from "colyseus";
import { MatchRoom } from "./rooms/MatchRoom";

interface HealthResponse {
  status(code: number): {
    json(body: Record<string, unknown>): unknown;
  };
}

export const server = defineServer({
  rooms: {
    lobby: defineRoom(LobbyRoom),
    match: defineRoom(MatchRoom).enableRealtimeListing()
  },

  express: (app) => {
    app.get("/healthz", (_request: unknown, response: HealthResponse) => {
      response.status(200).json({
        ok: true,
        service: "neon-fuse",
        platformMode: process.env.NEON_FUSE_PLATFORM_MODE ?? "local"
      });
    });
  }
});
