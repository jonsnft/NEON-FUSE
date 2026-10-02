import { listen } from "@colyseus/tools";
import { server } from "./app.config";

listen(server);
