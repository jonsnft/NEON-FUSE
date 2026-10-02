import type { CosmeticItem, CosmeticLoadout } from "./types";

export const COSMETIC_CATALOG: readonly CosmeticItem[] = [
  {
    id: "avatar.signal-cyan",
    category: "avatar",
    displayName: "Signal Cyan",
    description: "Starter shell tuned to a clean cyan carrier signal.",
    rarity: "COMMON",
    creatorId: "neon-fuse",
    visualToken: "cyan",
    gameplayEffect: "none"
  },
  {
    id: "avatar.signal-lime",
    category: "avatar",
    displayName: "Signal Lime",
    description: "Starter shell with a high-visibility lime terminal glow.",
    rarity: "COMMON",
    creatorId: "neon-fuse",
    visualToken: "lime",
    gameplayEffect: "none"
  },
  {
    id: "avatar.crt-ghost",
    category: "avatar",
    displayName: "CRT Ghost",
    description: "A phosphor apparition from a terminal that should have stayed offline.",
    rarity: "EPIC",
    creatorId: "neon-fuse",
    visualToken: "ghost",
    price: { unit: "shells", amount: 250 },
    gameplayEffect: "none"
  },
  {
    id: "core.plasma",
    category: "core",
    displayName: "Plasma Core",
    description: "Standard unstable plasma package.",
    rarity: "COMMON",
    creatorId: "neon-fuse",
    visualToken: "plasma",
    gameplayEffect: "none"
  },
  {
    id: "core.floppy",
    category: "core",
    displayName: "3.5 Inch Payload",
    description: "A suspiciously volatile data disk.",
    rarity: "RARE",
    creatorId: "neon-fuse",
    visualToken: "floppy",
    price: { unit: "shells", amount: 150 },
    gameplayEffect: "none"
  },
  {
    id: "blast.cyan-wave",
    category: "blast",
    displayName: "Cyan Wave",
    description: "Default carrier-wave blast presentation.",
    rarity: "COMMON",
    creatorId: "neon-fuse",
    visualToken: "cyan-wave",
    gameplayEffect: "none"
  },
  {
    id: "blast.binary-burst",
    category: "blast",
    displayName: "Binary Burst",
    description: "A visual data burst across blast cells.",
    rarity: "EPIC",
    creatorId: "neon-fuse",
    visualToken: "binary",
    price: { unit: "shells", amount: 300 },
    gameplayEffect: "none"
  },
  {
    id: "trail.scanline",
    category: "trail",
    displayName: "Scanline Trail",
    description: "A subtle CRT scanline wake.",
    rarity: "RARE",
    creatorId: "neon-fuse",
    visualToken: "scanline",
    price: { unit: "shells", amount: 125 },
    gameplayEffect: "none"
  },
  {
    id: "victory.root-access",
    category: "victory",
    displayName: "ROOT ACCESS",
    description: "Victory banner for operators who own the grid.",
    rarity: "LEGENDARY",
    creatorId: "neon-fuse",
    visualToken: "root",
    price: { unit: "shells", amount: 400 },
    gameplayEffect: "none"
  }
] as const;

export const DEFAULT_LOADOUT: CosmeticLoadout = {
  avatar: "avatar.signal-cyan",
  core: "core.plasma",
  blast: "blast.cyan-wave"
};

export const ALTERNATE_STARTER_LOADOUT: CosmeticLoadout = {
  avatar: "avatar.signal-lime",
  core: "core.plasma",
  blast: "blast.cyan-wave"
};

export const cosmeticById = (id: string): CosmeticItem | undefined =>
  COSMETIC_CATALOG.find((item) => item.id === id);
