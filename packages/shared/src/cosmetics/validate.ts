import { cosmeticById } from "./catalog";
import type { CosmeticLoadout } from "./types";

export function validateLoadout(loadout: CosmeticLoadout): boolean {
  const slots: Array<[keyof CosmeticLoadout, string | undefined]> = [
    ["avatar", loadout.avatar],
    ["core", loadout.core],
    ["blast", loadout.blast],
    ["trail", loadout.trail],
    ["victory", loadout.victory]
  ];

  return slots.every(([slot, id]) => {
    if (!id) return slot === "trail" || slot === "victory";
    const item = cosmeticById(id);
    return Boolean(item && item.category === slot && item.gameplayEffect === "none");
  });
}
