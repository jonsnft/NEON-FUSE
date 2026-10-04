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
  targetPickupCount,
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
    expect(noSpeed.pickups.length).toBeGreaterThan(2);
    expect(noSpeed.pickups.some((pickup) => pickup.kind === "speed")).toBe(false);
    expect(new Set(noSpeed.pickups.map((pickup) => pickup.kind))).toEqual(
      new Set(["range", "capacity"])
    );

    const none = createOfficialArena("grid-zero", ["p1", "p2"], {
      itemPresetId: "no-items",
      modifierPresetId: "standard",
      pacePresetId: "standard"
    });
    expect(none.pickups).toHaveLength(0);
  });

  it("scales pickup quantity deterministically with map density and player count", () => {
    const rules = {
      itemPresetId: "standard" as const,
      modifierPresetId: "standard" as const,
      pacePresetId: "standard" as const
    };
    const players = (count: number) => Array.from({ length: count }, (_, index) => `p${index + 1}`);

    for (const playerCount of [2, 4, 8]) {
      const state = createOfficialArena("grid-zero", players(playerCount), rules);
      const softCellCount = state.tiles.filter((tile) => tile === "soft").length;
      expect(state.pickups).toHaveLength(targetPickupCount(softCellCount, playerCount, 3));
      expect(new Set(state.pickups.map((pickup) => `${pickup.x},${pickup.y}`)).size).toBe(state.pickups.length);
    }

    const two = createOfficialArena("grid-zero", players(2), rules);
    const eight = createOfficialArena("grid-zero", players(8), rules);
    expect(two.pickups.length).toBeGreaterThan(3);
    expect(eight.pickups.length).toBeGreaterThanOrEqual(two.pickups.length);
  });

  it("scales no-speed pickups without reintroducing speed", () => {
    const state = createOfficialArena(
      "grid-zero",
      Array.from({ length: 8 }, (_, index) => `p${index + 1}`),
      {
        itemPresetId: "no-speed",
        modifierPresetId: "standard",
        pacePresetId: "standard"
      }
    );

    const softCellCount = state.tiles.filter((tile) => tile === "soft").length;
    expect(state.pickups).toHaveLength(targetPickupCount(softCellCount, 8, 2));
    expect(state.pickups.every((pickup) => pickup.kind === "range" || pickup.kind === "capacity")).toBe(true);
    expect(state.pickups.some((pickup) => pickup.kind === "speed")).toBe(false);
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
