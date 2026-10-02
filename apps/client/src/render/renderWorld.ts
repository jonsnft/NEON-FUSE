import { GameObjects } from "phaser";
import { indexOf, type GameState } from "@neon-fuse/shared";

export const TILE = 48;

export function renderWorld(
  graphics: GameObjects.Graphics,
  state: GameState,
  selfId?: string
): void {
  const g = graphics;
  g.clear();

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const tile = state.tiles[indexOf(state, x, y)];
      const px = x * TILE;
      const py = y * TILE;

      g.fillStyle(tile === "hard" ? 0x162f3a : tile === "soft" ? 0x254d59 : 0x0b171d, 1);
      g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);

      if (tile === "floor") {
        g.lineStyle(1, 0x12323d, 0.7);
        g.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
      }
    }
  }

  for (const pickup of state.pickups) {
    if (!pickup.revealed) continue;
    const color =
      pickup.kind === "range" ? 0xff4fd8 :
      pickup.kind === "capacity" ? 0x53f3ff :
      0xffe66d;
    g.fillStyle(color, 1);
    g.fillCircle(pickup.x * TILE + TILE / 2, pickup.y * TILE + TILE / 2, 9);
  }

  for (const core of state.cores) {
    g.fillStyle(0xff4fd8, 1);
    g.fillCircle(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, 14);
    g.lineStyle(3, 0xffffff, 0.8);
    g.strokeCircle(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, 14);
  }

  for (const blast of state.blasts) {
    g.fillStyle(0x53f3ff, 0.75);
    g.fillRect(blast.x * TILE + 4, blast.y * TILE + 4, TILE - 8, TILE - 8);
  }

  for (const player of state.players) {
    if (!player.alive) continue;
    g.fillStyle(player.id === selfId ? 0xe9ff70 : 0x53f3ff, 1);
    g.fillRect(player.x * TILE + 10, player.y * TILE + 10, TILE - 20, TILE - 20);
  }
}
