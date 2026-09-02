export type PetKind = "cat" | "hamster" | "panda";

export type PetMood =
  | "cheerful"
  | "playful"
  | "hungry"
  | "sleepy"
  | "lonely"
  | "messy"
  | "sleeping";

export type CareAction = "pet" | "wash" | "nap";

export type RoomPhase = "day" | "night";

export type PetInteractionKind =
  | "adopted"
  | "fed"
  | "petted"
  | "washed"
  | "napped"
  | "woken"
  | "played"
  | "decorated";

export interface PetInteraction {
  kind: PetInteractionKind;
  at: string;
  detail?: string;
}

export interface PetStats {
  fullness: number;
  happiness: number;
  energy: number;
  cleanliness: number;
}

export interface PetSave {
  version: 2;
  petType: PetKind;
  petName: string;
  stats: PetStats;
  coins: number;
  unlockedDecorations: string[];
  selectedDecoration: string;
  highScores: Record<string, number>;
  isSleeping: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  lastInteraction?: PetInteraction;
}

export interface AppUser {
  id: string;
  username: string;
  cloud: boolean;
}

export type SyncPhase = "saved" | "saving" | "local" | "error";

export interface SyncStatus {
  phase: SyncPhase;
  lastSavedAt: string | null;
}

export interface FeedItem {
  id: string;
  name: string;
  cost: number;
  fullness: number;
  happiness: number;
  icon: PixelIconName;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: PixelIconName;
  category: ShopCategory;
}

export type ShopCategory = "lights" | "soft" | "toys" | "decorations";

export type PixelIconName =
  | "fish"
  | "chicken"
  | "milk"
  | "seeds"
  | "carrot"
  | "apple"
  | "bamboo"
  | "berry"
  | "star"
  | "coin"
  | "heart"
  | "controller"
  | "moon"
  | "shop"
  | "flower"
  | "yarn"
  | "sparkle";
