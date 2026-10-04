import type { PickupKind, SimPickup } from "./types";

export interface PickupCell {
  x: number;
  y: number;
}

const PICKUP_DENSITY = 0.22;
const MIN_PICKUPS_PER_KIND = 2;
const MIN_PICKUPS_PER_PLAYER = 2;

export function targetPickupCount(
  softCellCount: number,
  playerCount: number,
  allowedKindCount: number
): number {
  if (softCellCount <= 0 || allowedKindCount <= 0) return 0;

  const densityTarget = Math.round(softCellCount * PICKUP_DENSITY);
  const varietyFloor = allowedKindCount * MIN_PICKUPS_PER_KIND;
  const playerFloor = Math.max(1, playerCount) * MIN_PICKUPS_PER_PLAYER;

  return Math.min(softCellCount, Math.max(densityTarget, varietyFloor, playerFloor));
}

export function distributePickups(
  softCells: readonly PickupCell[],
  playerCount: number,
  allowedKinds: readonly PickupKind[]
): SimPickup[] {
  const count = targetPickupCount(softCells.length, playerCount, allowedKinds.length);
  if (count === 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const positionIndex = Math.min(
      softCells.length - 1,
      Math.floor(((index + 0.5) * softCells.length) / count)
    );
    const position = softCells[positionIndex];

    return {
      x: position.x,
      y: position.y,
      kind: allowedKinds[index % allowedKinds.length],
      revealed: false
    };
  });
}
