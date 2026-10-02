import { listen } from "@colyseus/tools";
import { server } from "./app.config";

const rawPort = process.env.GAME_SERVER_PORT ?? "2567";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid GAME_SERVER_PORT: ${rawPort}`);
}

void listen(server, port);
