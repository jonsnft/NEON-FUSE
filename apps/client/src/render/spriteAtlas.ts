import type { Scene } from "phaser";
import type { PickupKind, TileKind } from "@neon-fuse/shared";
import type { Facing } from "./animatedPresentation";

export type AvatarVariant = "cyan" | "lime" | "ghost";

export const PRODUCTION_ATLAS_KEY = "neon-fuse-production-v3";
export const PRODUCTION_ATLAS_IMAGE = "/assets/neon-fuse-atlas.png?v=3";
export const PRODUCTION_ATLAS_DATA = "/assets/neon-fuse-atlas-v3.json";

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

export const playerFrame = (
  variant: AvatarVariant,
  facing: Facing,
  moving: boolean,
  timeMs: number,
  animated: boolean
): string => {
  if (!animated) return `player-${variant}-${facing}-idle-0`;
  if (!moving) return `player-${variant}-${facing}-idle-${Math.floor(timeMs / 650) % 2}`;
  return `player-${variant}-${facing}-move-${Math.floor(timeMs / 90) % 4}`;
};

export const eliminationFrame = (
  variant: AvatarVariant,
  elapsedMs: number,
  animated: boolean
): string => {
  const phase = animated ? Math.min(3, Math.floor(Math.max(0, elapsedMs) / 130)) : 2;
  return `elimination-${variant}-${phase}`;
};

export const corePlacementFrame = (elapsedMs: number): string =>
  `core-place-${Math.min(2, Math.floor(Math.max(0, elapsedMs) / 80))}`;

export const coreFrame = (urgency: number, timeMs: number, animated: boolean): string => {
  const clamped = Math.max(0, Math.min(1, urgency));
  const base = Math.min(3, Math.floor(clamped * 4));
  if (!animated) return `core-${base}`;
  const wobble = Math.floor(timeMs / Math.max(70, 180 - clamped * 100)) % 2;
  return `core-${Math.min(3, base + wobble)}`;
};

export const pickupFrame = (kind: PickupKind, timeMs: number, animated: boolean): string =>
  `pickup-${kind}-${animated ? Math.floor(timeMs / 220) % 2 : 0}`;
