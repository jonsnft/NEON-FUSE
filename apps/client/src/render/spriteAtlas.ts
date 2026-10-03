import type { Scene } from "phaser";
import type { PickupKind, TileKind } from "@neon-fuse/shared";
import type { Facing } from "./animatedPresentation";

export type AvatarVariant = "cyan" | "lime" | "ghost";

export const PRODUCTION_ATLAS_KEY = "neon-fuse-production";
export const PRODUCTION_ATLAS_IMAGE = "/assets/neon-fuse-atlas.png";

export const preloadProductionAtlas = (scene: Scene): void => {
  if (scene.textures.exists(PRODUCTION_ATLAS_KEY)) return;
  scene.load.spritesheet(PRODUCTION_ATLAS_KEY, PRODUCTION_ATLAS_IMAGE, {
    frameWidth: 48,
    frameHeight: 48
  });
};

const tileBase = (mapId: string): number => {
  if (mapId === "data-cross") return 3;
  if (mapId === "switchyard") return 6;
  return 0;
};

const tileOffset: Record<TileKind, number> = {
  floor: 0,
  hard: 1,
  soft: 2
};

const avatarBase: Record<AvatarVariant, number> = {
  cyan: 9,
  lime: 33,
  ghost: 57
};

const facingOffset: Record<Facing, number> = {
  down: 0,
  up: 6,
  left: 12,
  right: 18
};

const eliminationBase: Record<AvatarVariant, number> = {
  cyan: 81,
  lime: 85,
  ghost: 89
};

export const tileFrame = (mapId: string, tile: TileKind): number =>
  tileBase(mapId) + tileOffset[tile];

export const playerFrame = (
  variant: AvatarVariant,
  facing: Facing,
  moving: boolean,
  timeMs: number,
  animated: boolean
): number => {
  const base = avatarBase[variant] + facingOffset[facing];
  if (!animated) return base;
  if (!moving) return base + (Math.floor(timeMs / 650) % 2);
  return base + 2 + (Math.floor(timeMs / 90) % 4);
};

export const eliminationFrame = (
  variant: AvatarVariant,
  elapsedMs: number,
  animated: boolean
): number => {
  if (!animated) return eliminationBase[variant] + 2;
  const phase = Math.min(3, Math.floor(Math.max(0, elapsedMs) / 130));
  return eliminationBase[variant] + phase;
};

export const corePlacementFrame = (elapsedMs: number): number =>
  93 + Math.min(2, Math.floor(Math.max(0, elapsedMs) / 80));

export const coreFrame = (urgency: number, timeMs: number, animated: boolean): number => {
  const clamped = Math.max(0, Math.min(1, urgency));
  const base = Math.min(3, Math.floor(clamped * 4));
  if (!animated) return 96 + base;
  const wobble = Math.floor(timeMs / Math.max(70, 180 - clamped * 100)) % 2;
  return 96 + Math.min(3, base + wobble);
};

const pickupBase: Record<PickupKind, number> = {
  range: 100,
  capacity: 102,
  speed: 104
};

export const pickupFrame = (kind: PickupKind, timeMs: number, animated: boolean): number =>
  pickupBase[kind] + (animated ? Math.floor(timeMs / 220) % 2 : 0);
