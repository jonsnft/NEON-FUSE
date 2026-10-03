import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOBBY_CONFIG,
  PROTOCOL_VERSION,
  applyLobbyConfigPatch,
  createOfficialArena,
  indexOf,
  isLobbyConfigureRequest,
  placeCore,
  suddenDeathOrder,
  tickSimulation
} from "../src";

describe("lobby configuration", () => {
  it("validates allowlisted creator configuration requests", () => {
    expect(isLobbyConfigureRequest({
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: {
        mapId: "data-cross",
        maxPlayers: 6,
        itemPresetId: "no-speed",
        pacePresetId: "tactical"
      }
    })).toBe(true);

    expect(isLobbyConfigureRequest({
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: { fuseMs: 10 }
    })).toBe(false);

    expect(isLobbyConfigureRequest({
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: { itemPresetId: "everything" }
    })).toBe(false);

    expect(isLobbyConfigureRequest({
      type: "lobby.configure",
      version: PROTOCOL_VERSION,
      patch: { pacePresetId: "instant" }
    })).toBe(false);
  });

  it("rejects capacity below current connected players", () => {
    expect(applyLobbyConfigPatch(DEFAULT_LOBBY_CONFIG, { maxPlayers: 3 }, 4)).toBeNull();
    expect(applyLobbyConfigPatch(DEFAULT_LOBBY_CONFIG, { maxPlayers: 4 }, 4)?.maxPlayers).toBe(4);
  });

  it("applies item presets to deterministic pickup creation", () => {
    const noSpeed = createOfficialArena("grid-zero", ["p1", "p2"], {
      itemPresetId: "no-speed",
      modifierPresetId: "standard",
      pacePresetId: "standard"
    });
    expect(noSpeed.pickups.some((pickup) => pickup.kind === "speed")).toBe(false);
    expect(noSpeed.pickups.map((pickup) => pickup.kind)).toEqual(["range", "capacity"]);

    const none = createOfficialArena("grid-zero", ["p1", "p2"], {
      itemPresetId: "no-items",
      modifierPresetId: "standard",
      pacePresetId: "standard"
    });
    expect(none.pickups).toHaveLength(0);
  });

  it("resolves core fuse from the selected pace preset", () => {
    const standard = createOfficialArena("grid-zero", ["p1", "p2"], {
      itemPresetId: "standard",
      modifierPresetId: "standard",
      pacePresetId: "standard"
    });
    expect(placeCore(standard, "p1")).toBe(true);
    expect(standard.cores[0].fuseMs).toBe(1800);

    const tactical = createOfficialArena("grid-zero", ["p1", "p2"], {
      itemPresetId: "standard",
      modifierPresetId: "standard",
      pacePresetId: "tactical"
    });
    expect(placeCore(tactical, "p1")).toBe(true);
    expect(tactical.cores[0].fuseMs).toBe(2400);
  });

  it("keeps hard round deadline while disabling sudden death contraction", () => {
    const state = createOfficialArena("grid-zero", ["p1", "p2"], {
      itemPresetId: "standard",
      modifierPresetId: "no-sudden-death",
      pacePresetId: "standard"
    });
    const first = suddenDeathOrder(state.width, state.height)[0];
    const before = state.tiles[indexOf(state, first.x, first.y)];
    state.elapsedMs = state.suddenDeathStartMs - 1;

    tickSimulation(state, 1);

    expect(state.tiles[indexOf(state, first.x, first.y)]).toBe(before);
    expect(state.suddenDeathCursor).toBe(0);
    expect(state.phase).toBe("playing");
  });
});
