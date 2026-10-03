export type Facing = "up" | "down" | "left" | "right";

export interface FuseVisual {
  urgency: number;
  pulseMs: number;
  ringRadius: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const inferFacing = (
  previousX: number,
  previousY: number,
  nextX: number,
  nextY: number,
  fallback: Facing = "down"
): Facing => {
  const dx = nextX - previousX;
  const dy = nextY - previousY;

  if (Math.abs(dx) > Math.abs(dy) && dx !== 0) return dx > 0 ? "right" : "left";
  if (dy !== 0) return dy > 0 ? "down" : "up";
  if (dx !== 0) return dx > 0 ? "right" : "left";
  return fallback;
};

export const fuseVisual = (fuseMs: number): FuseVisual => {
  const safeFuseMs = Math.max(0, fuseMs);
  const urgency = clamp01(1 - safeFuseMs / 2200);
  return {
    urgency,
    pulseMs: 210 - urgency * 125,
    ringRadius: 13 + urgency * 4
  };
};

export const stableAnimationSeed = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
};
