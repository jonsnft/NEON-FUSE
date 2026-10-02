import { Client } from "@colyseus/sdk";

const endpoint = import.meta.env.VITE_GAME_SERVER_URL ?? "http://localhost:2567";

export const networkClient = new Client(endpoint);
