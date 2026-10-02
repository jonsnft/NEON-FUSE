import { describe, expect, it } from "vitest";
import {
  createArena,
  indexOf,
  movePlayer,
  placeCore,
  playerById,
  resolveRound,
  tickSimulation
} from "../src";

describe("NEON FUSE deterministic simulation", () => {
  it("creates the 15x13 reference arena with a safe spawn", () => {
    const state = createArena(["p1"]);
    expect(state.width).toBe(15);
    expect(state.height).toBe(13);
    expect(state.tiles[indexOf(state, 1, 1)]).toBe("floor");
    expect(state.tiles[indexOf(state, 2, 1)]).toBe("floor");
    expect(state.tiles[indexOf(state, 1, 2)]).toBe("floor");
  });

  it("creates distinct safe spawns for multiplayer", () => {
    const state = createArena(["p1", "p2", "p3", "p4"]);
    expect(new Set(state.players.map((p) => `${p.x},${p.y}`)).size).toBe(4);
    for (const p of state.players) expect(state.tiles[indexOf(state, p.x, p.y)]).toBe("floor");
  });

  it("enforces per-player core capacity and snapshots blast range", () => {
    const state = createArena(["p1", "p2"]);
    const p1 = playerById(state, "p1")!;
    p1.blastRange = 3;
    expect(placeCore(state, "p1", 100)).toBe(true);
    expect(placeCore(state, "p1", 100)).toBe(false);
    expect(state.cores[0].blastRange).toBe(3);
  });

  it("destroys a soft block and reveals its pickup", () => {
    const state = createArena(["p1"]);
    const p1 = playerById(state, "p1")!;
    p1.x = 2;
    p1.y = 1;
    p1.blastRange = 1;

    state.tiles[indexOf(state, 3, 1)] = "soft";
    state.pickups.push({ x: 3, y: 1, kind: "range", revealed: false });
    placeCore(state, "p1", 1);
    p1.x = 1;
    tickSimulation(state, 2);

    expect(state.tiles[indexOf(state, 3, 1)]).toBe("floor");
    expect(state.pickups.find((p) => p.x === 3 && p.y === 1)?.revealed).toBe(true);
  });

  it("applies revealed pickups through movement", () => {
    const state = createArena(["p1"]);
    state.tiles[indexOf(state, 2, 1)] = "floor";
    state.pickups.push({ x: 2, y: 1, kind: "range", revealed: true });
    const p1 = playerById(state, "p1")!;
    const before = p1.blastRange;

    expect(movePlayer(state, "p1", "right")).toBe(true);
    expect(p1.blastRange).toBe(before + 1);
  });

  it("chain-reacts a second core hit by a blast", () => {
    const state = createArena(["p1"]);
    state.tiles[indexOf(state, 2, 1)] = "floor";
    state.tiles[indexOf(state, 3, 1)] = "floor";
    state.cores = [
      { id: "a", ownerId: "p1", x: 1, y: 1, fuseMs: 1, blastRange: 3 },
      { id: "b", ownerId: "p1", x: 3, y: 1, fuseMs: 9999, blastRange: 1 }
    ];
    const p1 = playerById(state, "p1")!;
    p1.x = 1;
    p1.y = 2;

    tickSimulation(state, 2);

    expect(state.cores).toHaveLength(0);
    expect(state.blasts.some((blast) => blast.x === 3 && blast.y === 1)).toBe(true);
  });

  it("finishes a multiplayer round when one player remains", () => {
    const state = createArena(["p1", "p2"]);
    playerById(state, "p2")!.alive = false;
    resolveRound(state);
    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBe("p1");
  });

  it("records a draw when no player remains", () => {
    const state = createArena(["p1", "p2"]);
    state.players.forEach((p) => { p.alive = false; });
    resolveRound(state);
    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBeNull();
  });
});
