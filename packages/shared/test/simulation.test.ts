import { describe, expect, it } from "vitest";
import {
  createArena,
  indexOf,
  movePlayer,
  placeCore,
  tickSimulation
} from "../src";

describe("NEON FUSE deterministic simulation", () => {
  it("creates the 15x13 reference arena with a safe spawn", () => {
    const state = createArena();
    expect(state.width).toBe(15);
    expect(state.height).toBe(13);
    expect(state.tiles[indexOf(state, 1, 1)]).toBe("floor");
    expect(state.tiles[indexOf(state, 2, 1)]).toBe("floor");
    expect(state.tiles[indexOf(state, 1, 2)]).toBe("floor");
  });

  it("enforces core capacity and snapshots blast range", () => {
    const state = createArena();
    state.player.blastRange = 3;
    expect(placeCore(state, 100)).toBe(true);
    expect(placeCore(state, 100)).toBe(false);
    expect(state.cores[0].blastRange).toBe(3);
  });

  it("destroys a soft block and reveals its pickup", () => {
    const state = createArena();
    state.player.x = 2;
    state.player.y = 1;
    state.player.blastRange = 1;

    expect(state.tiles[indexOf(state, 3, 1)]).toBe("soft");
    placeCore(state, 1);
    state.player.x = 1;
    tickSimulation(state, 2);

    expect(state.tiles[indexOf(state, 3, 1)]).toBe("floor");
    expect(state.pickups.find((p) => p.x === 3 && p.y === 1)?.revealed).toBe(true);
  });

  it("applies revealed pickups through movement", () => {
    const state = createArena();
    state.tiles[indexOf(state, 2, 1)] = "floor";
    state.pickups.push({ x: 2, y: 1, kind: "range", revealed: true });

    const before = state.player.blastRange;
    expect(movePlayer(state, "right")).toBe(true);
    expect(state.player.blastRange).toBe(before + 1);
  });

  it("chain-reacts a second core hit by a blast", () => {
    const state = createArena();
    state.tiles[indexOf(state, 2, 1)] = "floor";
    state.tiles[indexOf(state, 3, 1)] = "floor";
    state.cores = [
      { id: "a", ownerId: state.player.id, x: 1, y: 1, fuseMs: 1, blastRange: 3 },
      { id: "b", ownerId: state.player.id, x: 3, y: 1, fuseMs: 9999, blastRange: 1 }
    ];
    state.player.x = 1;
    state.player.y = 2;

    tickSimulation(state, 2);

    expect(state.cores).toHaveLength(0);
    expect(state.blasts.some((blast) => blast.x === 3 && blast.y === 1)).toBe(true);
  });
});
