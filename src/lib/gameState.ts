import { PETS } from "../data/pets";
import type { CareAction, FeedItem, PetKind, PetMood, PetSave, PetStats } from "../types";

const clamp = (value: number) => Math.max(15, Math.min(100, Math.round(value)));

const touch = (save: PetSave, changes: Partial<PetSave>): PetSave => ({
  ...save,
  ...changes,
  lastSeenAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function createPetSave(petType: PetKind, petName: string): PetSave {
  const now = new Date().toISOString();
  return {
    version: 1,
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
  if (save.coins < item.cost) return save;
  return touch(save, {
    coins: save.coins - item.cost,
    isSleeping: false,
    stats: {
      ...save.stats,
      fullness: clamp(save.stats.fullness + item.fullness),
      happiness: clamp(save.stats.happiness + item.happiness),
    },
  });
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
    });
  }
  return touch(save, {
    isSleeping: true,
    stats: {
      ...save.stats,
      energy: clamp(save.stats.energy + 26),
      fullness: clamp(save.stats.fullness - 3),
    },
  });
}

export function wakePet(save: PetSave): PetSave {
  return touch(save, { isSleeping: false });
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
  });
}

export function getPetFoods(kind: PetKind): FeedItem[] {
  return PETS[kind].foods;
}
