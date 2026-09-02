import type { AppUser, PetSave } from "../types";
import { loadCloudSave, saveToCloud } from "./supabase";

const keyFor = (userId: string) => `kpf:save:${userId}`;

export function loadLocalSave(userId: string): PetSave | null {
  const raw = localStorage.getItem(keyFor(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PetSave;
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
    if (!cloud) return local;
    if (!local) return cloud;
    return new Date(cloud.updatedAt) > new Date(local.updatedAt) ? cloud : local;
  } catch {
    return local;
  }
}

export async function syncSave(user: AppUser, save: PetSave): Promise<void> {
  saveLocally(user.id, save);
  if (user.cloud) await saveToCloud(user.id, save);
}
