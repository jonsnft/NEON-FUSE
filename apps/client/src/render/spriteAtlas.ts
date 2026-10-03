import type { Scene } from "phaser";
import type { PickupKind, TileKind } from "@neon-fuse/shared";
import type { Facing } from "./animatedPresentation";

export const PRODUCTION_ATLAS_KEY = "neon-fuse-production";
export const PRODUCTION_ATLAS_IMAGE = "/assets/neon-fuse-atlas.png";
export const PRODUCTION_ATLAS_DATA = "/assets/neon-fuse-atlas.json";

export const preloadProductionAtlas = (scene: Scene): void => {
  if (scene.textures.exists(PRODUCTION_ATLAS_KEY)) return;
  scene.load.atlas(PRODUCTION_ATLAS_KEY, PRODUCTION_ATLAS_IMAGE, PRODUCTION_ATLAS_DATA);
};

const mapPrefix = (mapId: string): "grid" | "data" | "switch" => {
  if (mapId === "data-cross") return "data";
  if (mapId === "switchyard") return "switch";
  return "grid";
};

export const tileFrame = (mapId: string, tile: TileKind): string =>
  `tile-${mapPrefix(mapId)}-${tile}`;

export const playerFrame = (facing: Facing, moving: boolean): string =>
  `player-${facing}-${moving ? "move" : "idle"}`;

export const coreFrame = (urgency: number, timeMs: number, animated: boolean): string => {
  const clamped = Math.max(0, Math.min(1, urgency));
  const base = Math.min(3, Math.floor(clamped * 4));
  if (!animated) return `core-${base}`;
  const wobble = Math.floor(timeMs / Math.max(70, 180 - clamped * 100)) % 2;
  return `core-${Math.min(3, base + wobble)}`;
};

export const pickupFrame = (kind: PickupKind, timeMs: number, animated: boolean): string =>
  `pickup-${kind}-${animated ? Math.floor(timeMs / 220) % 2 : 0}`;
