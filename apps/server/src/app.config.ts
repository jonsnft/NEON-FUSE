import { defineRoom, defineServer } from "colyseus";
import { MatchRoom } from "./rooms/MatchRoom";

export const server = defineServer({
  rooms: {
    match: defineRoom(MatchRoom).enableRealtimeListing()
  }
});
