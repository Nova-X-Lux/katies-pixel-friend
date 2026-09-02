import { PETS } from "../data/pets";
import { SHOP_ITEMS } from "../data/shop";
import type { CareAction, FeedItem, PetInteractionKind, PetKind, PetMood, PetSave, PetStats, RoomPhase, ShopItem } from "../types";

const clamp = (value: number) => Math.max(15, Math.min(100, Math.round(value)));

const touch = (save: PetSave, changes: Partial<PetSave>): PetSave => ({
  ...save,
  ...changes,
  lastSeenAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const interaction = (kind: PetInteractionKind, detail?: string) => ({
  kind,
  at: new Date().toISOString(),
  ...(detail ? { detail } : {}),
});

export function createPetSave(petType: PetKind, petName: string): PetSave {
  const now = new Date().toISOString();
  return {
    version: 2,
    petType,
    petName: petName.trim(),
    stats: { fullness: 82, happiness: 86, energy: 78, cleanliness: 88 },
    coins: 25,
    unlockedDecorations: ["heart-lamp"],
    selectedDecoration: "heart-lamp",
    highScores: {},
    isSleeping: false,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
    lastInteraction: { kind: "adopted", at: now, detail: petType },
  };
}

export function applyTimeDecay(save: PetSave, now = new Date()): PetSave {
  const elapsedHours = Math.max(0, (now.getTime() - new Date(save.lastSeenAt).getTime()) / 3_600_000);
  if (elapsedHours < 0.1) return save;

  const decayScale = Math.min(elapsedHours, 72);
  const stats: PetStats = {
    fullness: clamp(save.stats.fullness - decayScale * 1.45),
    happiness: clamp(save.stats.happiness - decayScale * 0.62),
    energy: clamp(save.stats.energy - decayScale * (save.isSleeping ? -1.9 : 0.9)),
    cleanliness: clamp(save.stats.cleanliness - decayScale * 0.52),
  };

  return touch(save, {
    stats,
    isSleeping: save.isSleeping && stats.energy < 96,
  });
}

export function deriveMood(save: PetSave): PetMood {
  if (save.isSleeping) return "sleeping";
  if (save.stats.fullness < 35) return "hungry";
  if (save.stats.energy < 32) return "sleepy";
  if (save.stats.happiness < 38) return "lonely";
  if (save.stats.cleanliness < 36) return "messy";
  if (save.stats.happiness > 78 && save.stats.energy > 48) return "playful";
  return "cheerful";
}

export function feedPet(save: PetSave, item: FeedItem): PetSave {
  const availability = getFeedAvailability(save, item);
  if (!availability.allowed) return save;
  return touch(save, {
    coins: save.coins - item.cost,
    isSleeping: false,
    stats: {
      ...save.stats,
      fullness: clamp(save.stats.fullness + item.fullness),
      happiness: clamp(save.stats.happiness + item.happiness),
    },
    lastInteraction: interaction("fed", item.name),
  });
}

export type FeedBlockReason = "too-full" | "not-enough-coins" | null;

export interface FeedAvailability {
  allowed: boolean;
  reason: FeedBlockReason;
  fullnessGain: number;
  happinessGain: number;
}

export function getFeedAvailability(save: PetSave, item: FeedItem): FeedAvailability {
  const fullnessGain = Math.max(0, Math.min(item.fullness, 100 - save.stats.fullness));
  const happinessGain = Math.max(0, Math.min(item.happiness, 100 - save.stats.happiness));
  if (save.coins < item.cost) return { allowed: false, reason: "not-enough-coins", fullnessGain, happinessGain };
  if (fullnessGain < item.fullness) return { allowed: false, reason: "too-full", fullnessGain, happinessGain };
  return { allowed: true, reason: null, fullnessGain, happinessGain };
}

export function careForPet(save: PetSave, action: CareAction): PetSave {
  if (action === "pet") {
    return touch(save, {
      isSleeping: false,
      stats: {
        ...save.stats,
        happiness: clamp(save.stats.happiness + 14),
        energy: clamp(save.stats.energy - 2),
      },
      lastInteraction: interaction("petted"),
    });
  }
  if (action === "wash") {
    return touch(save, {
      isSleeping: false,
      stats: {
        ...save.stats,
        cleanliness: clamp(save.stats.cleanliness + 30),
        happiness: clamp(save.stats.happiness + (save.petType === "cat" ? -2 : 3)),
      },
      lastInteraction: interaction("washed"),
    });
  }
  return touch(save, {
    isSleeping: true,
    stats: {
      ...save.stats,
      energy: clamp(save.stats.energy + 26),
      fullness: clamp(save.stats.fullness - 3),
    },
    lastInteraction: interaction("napped"),
  });
}

export function wakePet(save: PetSave): PetSave {
  return touch(save, { isSleeping: false, lastInteraction: interaction("woken") });
}

export function awardGame(save: PetSave, gameId: string, score: number, coins: number): PetSave {
  return touch(save, {
    coins: save.coins + Math.max(0, coins),
    isSleeping: false,
    highScores: {
      ...save.highScores,
      [gameId]: Math.max(score, save.highScores[gameId] ?? 0),
    },
    stats: {
      ...save.stats,
      happiness: clamp(save.stats.happiness + 10),
      energy: clamp(save.stats.energy - 7),
    },
    lastInteraction: interaction("played", gameId),
  });
}

export function getTreatCatchReward(score: number): number {
  return score <= 0 ? 0 : 6 + Math.floor(score / 30);
}

export function getMemoryReward(moves: number): number {
  return 10 + Math.max(0, 8 - Math.floor(moves / 3));
}

export function buyShopItem(save: PetSave, item: ShopItem): PetSave {
  const owned = save.unlockedDecorations ?? ["heart-lamp"];
  if (owned.includes(item.id)) {
    return touch(save, {
      selectedDecoration: item.id,
      lastInteraction: interaction("decorated", item.name),
    });
  }
  if (save.coins < item.cost) return save;
  return touch(save, {
    coins: save.coins - item.cost,
    unlockedDecorations: [...owned, item.id],
    selectedDecoration: item.id,
    stats: {
      ...save.stats,
      happiness: clamp(save.stats.happiness + 4),
    },
    lastInteraction: interaction("decorated", item.name),
  });
}

export function selectShopItem(save: PetSave, itemId: string): PetSave {
  const owned = save.unlockedDecorations ?? ["heart-lamp"];
  if (!owned.includes(itemId)) return save;
  const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId);
  return touch(save, {
    selectedDecoration: itemId,
    lastInteraction: interaction("decorated", item?.name ?? itemId),
  });
}

export function getRoomPhase(now = new Date()): RoomPhase {
  const hour = now.getHours();
  return hour >= 7 && hour < 19 ? "day" : "night";
}

export function getPetFoods(kind: PetKind): FeedItem[] {
  return PETS[kind].foods;
}

export function formatPetAge(createdAt: string, now = new Date()): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "New friend";
  const ageDays = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86_400_000));
  if (ageDays < 1) return "Less than a day old";
  if (ageDays < 14) return `${ageDays} day${ageDays === 1 ? "" : "s"} old`;
  if (ageDays < 60) {
    const weeks = Math.floor(ageDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} old`;
  }
  if (ageDays < 730) {
    const months = Math.floor(ageDays / 30);
    return `${months} month${months === 1 ? "" : "s"} old`;
  }
  const years = Math.floor(ageDays / 365);
  return `${years} year${years === 1 ? "" : "s"} old`;
}
