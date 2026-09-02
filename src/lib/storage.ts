import type { AppUser, PetInteractionKind, PetSave } from "../types";
import { loadCloudSave, saveToCloud } from "./supabase";

const keyFor = (userId: string) => `kpf:save:${userId}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isInteractionKind(value: unknown): value is PetInteractionKind {
  return typeof value === "string" && [
    "adopted",
    "fed",
    "petted",
    "washed",
    "napped",
    "woken",
    "played",
    "decorated",
  ].includes(value);
}

export function migrateSave(value: unknown): PetSave | null {
  if (!isRecord(value)) return null;
  if (value.petType !== "cat" && value.petType !== "hamster" && value.petType !== "panda") return null;
  if (typeof value.petName !== "string" || !isRecord(value.stats)) return null;

  const stats = value.stats;
  if (![stats.fullness, stats.happiness, stats.energy, stats.cleanliness].every((stat) => typeof stat === "number" && Number.isFinite(stat))) return null;

  const now = new Date().toISOString();
  const createdAt = isDateString(value.createdAt) ? value.createdAt : now;
  const updatedAt = isDateString(value.updatedAt) ? value.updatedAt : createdAt;
  const lastSeenAt = isDateString(value.lastSeenAt) ? value.lastSeenAt : updatedAt;
  const lastInteraction = isRecord(value.lastInteraction)
    && isInteractionKind(value.lastInteraction.kind)
    && isDateString(value.lastInteraction.at)
    ? {
        kind: value.lastInteraction.kind,
        at: value.lastInteraction.at,
        ...(typeof value.lastInteraction.detail === "string" ? { detail: value.lastInteraction.detail } : {}),
      }
    : undefined;

  return {
    version: 2,
    petType: value.petType,
    petName: value.petName,
    stats: {
      fullness: stats.fullness as number,
      happiness: stats.happiness as number,
      energy: stats.energy as number,
      cleanliness: stats.cleanliness as number,
    },
    coins: typeof value.coins === "number" ? value.coins : 0,
    unlockedDecorations: Array.isArray(value.unlockedDecorations)
      ? value.unlockedDecorations.filter((item): item is string => typeof item === "string")
      : ["heart-lamp"],
    selectedDecoration: typeof value.selectedDecoration === "string" ? value.selectedDecoration : "heart-lamp",
    highScores: isRecord(value.highScores)
      ? Object.fromEntries(Object.entries(value.highScores).filter((entry): entry is [string, number] => typeof entry[1] === "number"))
      : {},
    isSleeping: Boolean(value.isSleeping),
    lastSeenAt,
    createdAt,
    updatedAt,
    ...(lastInteraction ? { lastInteraction } : {}),
  };
}

export function loadLocalSave(userId: string): PetSave | null {
  const raw = localStorage.getItem(keyFor(userId));
  if (!raw) return null;
  try {
    return migrateSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLocally(userId: string, save: PetSave): void {
  localStorage.setItem(keyFor(userId), JSON.stringify(save));
}

export function deleteLocalSave(userId: string): void {
  localStorage.removeItem(keyFor(userId));
}

export async function loadBestSave(user: AppUser): Promise<PetSave | null> {
  const local = loadLocalSave(user.id);
  if (!user.cloud) return local;
  try {
    const cloud = await loadCloudSave(user.id);
    const migratedCloud = migrateSave(cloud);
    if (!migratedCloud) return local;
    if (!local) return migratedCloud;
    return new Date(migratedCloud.updatedAt) > new Date(local.updatedAt) ? migratedCloud : local;
  } catch {
    return local;
  }
}

export async function syncSave(user: AppUser, save: PetSave): Promise<void> {
  saveLocally(user.id, save);
  if (user.cloud) await saveToCloud(user.id, save);
}
