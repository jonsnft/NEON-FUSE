export type CosmeticCategory = "avatar" | "core" | "blast" | "trail" | "victory";
export type CosmeticRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "CREATOR" | "EVENT";

export interface CosmeticPrice {
  unit: "shells";
  amount: number;
}

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  displayName: string;
  description: string;
  rarity: CosmeticRarity;
  creatorId: string;
  visualToken: string;
  price?: CosmeticPrice;
  gameplayEffect: "none";
}

export interface CosmeticLoadout {
  avatar: string;
  core: string;
  blast: string;
  trail?: string;
  victory?: string;
}

export interface PlayerPresentation {
  loadout: CosmeticLoadout;
}
