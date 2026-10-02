import { LobbyRoom, defineRoom, defineServer } from "colyseus";
import { MatchRoom } from "./rooms/MatchRoom";

export const server = defineServer({
  rooms: {
    lobby: defineRoom(LobbyRoom),
    match: defineRoom(MatchRoom).enableRealtimeListing()
  }
});
