import type { AppUser, PetInteractionKind, PetSave } from "../types";
import { migrateKeepsakes, stampMilestones } from "./keepsakes";
import { loadCloudSave, saveToCloud } from "./supabase";

const keyFor = (userId: string) => `kpf:save:${userId}`;
const SAVE_VERSION = 3;

export class SaveLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveLoadError";
  }
}

export class LocalStorageError extends Error {
  constructor() {
    super("This browser could not save your friend. Allow site storage or free up some space, then try again.");
    this.name = "LocalStorageError";
  }
}

export interface LoadedSave {
  save: PetSave | null;
  cloudFailed: boolean;
}

export interface SavedLocations {
  localSaved: boolean;
  cloudSaved: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)))
    : 0;
}

function isItemId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
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
  if (value.version !== 1 && value.version !== 2 && value.version !== SAVE_VERSION) return null;
  if (value.petType !== "cat" && value.petType !== "hamster" && value.petType !== "panda") return null;
  if (typeof value.petName !== "string" || !value.petName.trim() || value.petName.length > 100 || !isRecord(value.stats)) return null;

  const stats = value.stats;
  if (![stats.fullness, stats.happiness, stats.energy, stats.cleanliness].every((stat) => typeof stat === "number" && Number.isFinite(stat))) return null;
  if (!isDateString(value.createdAt)) return null;

  const createdAt = value.createdAt;
  const updatedAt = isDateString(value.updatedAt) ? value.updatedAt : createdAt;
  const lastSeenAt = isDateString(value.lastSeenAt) ? value.lastSeenAt : updatedAt;
  const lastInteraction = isRecord(value.lastInteraction)
    && isInteractionKind(value.lastInteraction.kind)
    && isDateString(value.lastInteraction.at)
    ? {
        kind: value.lastInteraction.kind,
        at: value.lastInteraction.at,
        ...(typeof value.lastInteraction.detail === "string" ? { detail: value.lastInteraction.detail.slice(0, 100) } : {}),
      }
    : undefined;
  const unlockedDecorations = [...new Set([
    "heart-lamp",
    ...(Array.isArray(value.unlockedDecorations) ? value.unlockedDecorations.filter(isItemId) : []),
  ])];
  const selectedDecoration = isItemId(value.selectedDecoration) && unlockedDecorations.includes(value.selectedDecoration)
    ? value.selectedDecoration
    : "heart-lamp";
  const clampStat = (stat: unknown) => Math.max(15, Math.min(100, stat as number));

  return stampMilestones({
    version: SAVE_VERSION,
    petType: value.petType,
    petName: value.petName.trim(),
    stats: {
      fullness: clampStat(stats.fullness),
      happiness: clampStat(stats.happiness),
      energy: clampStat(stats.energy),
      cleanliness: clampStat(stats.cleanliness),
    },
    coins: safeCount(value.coins),
    unlockedDecorations,
    selectedDecoration,
    highScores: isRecord(value.highScores)
      ? Object.fromEntries(Object.entries(value.highScores)
          .filter(([key, score]) => isItemId(key) && typeof score === "number" && Number.isFinite(score))
          .map(([key, score]) => [key, safeCount(score)]))
      : {},
    isSleeping: value.isSleeping === true,
    lastSeenAt,
    createdAt,
    updatedAt,
    keepsakes: migrateKeepsakes(value.keepsakes),
    ...(lastInteraction ? { lastInteraction } : {}),
  });
}

function validateLoadedSave(value: unknown): PetSave {
  if (isRecord(value) && typeof value.version === "number" && value.version > SAVE_VERSION) {
    throw new SaveLoadError("Your friend was saved with a newer update. Refresh the website to open it safely.");
  }
  const save = migrateSave(value);
  if (!save) throw new SaveLoadError("Your friend's save could not be opened. Please try again; the existing save has been kept.");
  return save;
}

export function loadLocalSave(userId: string): PetSave | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(keyFor(userId));
  } catch {
    throw new LocalStorageError();
  }
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SaveLoadError("The save on this device could not be opened. It has been kept so it can be recovered.");
  }
  return validateLoadedSave(parsed);
}

export function saveLocally(userId: string, save: PetSave): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(save));
  } catch {
    throw new LocalStorageError();
  }
}

export function deleteLocalSave(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    throw new LocalStorageError();
  }
}

export async function loadBestSave(user: AppUser): Promise<LoadedSave> {
  let local: PetSave | null = null;
  try {
    local = loadLocalSave(user.id);
  } catch (error) {
    if (!(error instanceof LocalStorageError) || !user.cloud) throw error;
  }
  if (!user.cloud) return { save: local, cloudFailed: false };

  let cloud: unknown;
  try {
    cloud = await loadCloudSave(user.id);
  } catch {
    // The caller must wait for a successful cloud read before creating or syncing a save.
    return { save: local, cloudFailed: true };
  }
  if (cloud === null) return { save: local, cloudFailed: false };
  const migratedCloud = validateLoadedSave(cloud);
  const save = local && new Date(local.updatedAt) > new Date(migratedCloud.updatedAt) ? local : migratedCloud;
  return { save, cloudFailed: false };
}

export async function syncSave(user: AppUser, save: PetSave): Promise<SavedLocations> {
  let localSaved = false;
  try {
    saveLocally(user.id, save);
    localSaved = true;
  } catch (error) {
    if (!user.cloud) throw error;
  }
  if (user.cloud) await saveToCloud(user.id, save);
  return { localSaved, cloudSaved: user.cloud };
}
