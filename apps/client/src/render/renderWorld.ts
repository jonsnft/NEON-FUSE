import { GameObjects } from "phaser";
import {
  cosmeticById,
  indexOf,
  type GameState,
  type PlayerPresentation
} from "@neon-fuse/shared";

export const TILE = 48;

const colorForAvatar = (presentation?: PlayerPresentation): number => {
  const token = presentation ? cosmeticById(presentation.loadout.avatar)?.visualToken : undefined;
  if (token === "lime") return 0xe9ff70;
  if (token === "ghost") return 0xb98cff;
  return 0x53f3ff;
};

const coreToken = (presentation?: PlayerPresentation): string | undefined =>
  presentation ? cosmeticById(presentation.loadout.core)?.visualToken : undefined;

export function renderWorld(
  graphics: GameObjects.Graphics,
  state: GameState,
  selfId?: string,
  presentations: Record<string, PlayerPresentation> = {}
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
    const presentation = presentations[core.ownerId];
    const token = coreToken(presentation);
    g.fillStyle(0xff4fd8, 1);
    if (token === "floppy") {
      g.fillRect(core.x * TILE + 10, core.y * TILE + 11, TILE - 20, TILE - 22);
      g.fillStyle(0x071015, 1);
      g.fillRect(core.x * TILE + 16, core.y * TILE + 15, TILE - 32, 8);
    } else {
      g.fillCircle(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, 14);
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeCircle(core.x * TILE + TILE / 2, core.y * TILE + TILE / 2, 14);
    }
  }

  for (const blast of state.blasts) {
    g.fillStyle(0x53f3ff, 0.75);
    g.fillRect(blast.x * TILE + 4, blast.y * TILE + 4, TILE - 8, TILE - 8);
  }

  for (const player of state.players) {
    if (!player.alive) continue;
    const presentation = presentations[player.id];
    const color = player.id === selfId ? 0xffffff : colorForAvatar(presentation);
    g.fillStyle(color, 1);
    g.fillRect(player.x * TILE + 10, player.y * TILE + 10, TILE - 20, TILE - 20);

    if (cosmeticById(presentation?.loadout.avatar ?? "")?.visualToken === "ghost") {
      g.lineStyle(2, 0xb98cff, 0.6);
      g.strokeRect(player.x * TILE + 6, player.y * TILE + 6, TILE - 12, TILE - 12);
    }
  }
}
