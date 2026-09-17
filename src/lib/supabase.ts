import { createClient } from "@supabase/supabase-js";
import type { AppUser, PetSave } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const lastUsernameKey = "kpf:last-username";

export const isCloudConfigured = Boolean(url && publishableKey);

export const supabase = isCloudConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_-]{1,24}$/.test(normalizeUsername(username));
}

function userFor(username: string): AppUser {
  return {
    id: isCloudConfigured ? username : `preview-${username}`,
    username,
    cloud: isCloudConfigured,
  };
}

export function restoreUser(): AppUser | null {
  try {
    const username = localStorage.getItem(lastUsernameKey);
    if (!username || !isValidUsername(username)) return null;
    if (!isCloudConfigured && !import.meta.env.DEV) return null;
    return userFor(normalizeUsername(username));
  } catch {
    // Remembering a username is optional when browser storage is unavailable.
    return null;
  }
}

export async function enterWithUsername(username: string): Promise<AppUser> {
  const cleaned = normalizeUsername(username);
  if (!isValidUsername(cleaned)) {
    throw new Error("Use 1–24 letters, numbers, underscores or hyphens.");
  }

  if (!supabase && !import.meta.env.DEV) {
    throw new Error("Cloud saving has not been connected yet.");
  }

  try {
    localStorage.setItem(lastUsernameKey, cleaned);
  } catch {
    if (!supabase) throw new Error("This browser cannot save your friend. Allow site storage and try again.");
  }
  return userFor(cleaned);
}

export function forgetUsername(): void {
  try {
    localStorage.removeItem(lastUsernameKey);
  } catch {
    // The current session can still be closed if site storage is blocked.
  }
}

export async function loadCloudSave(username: string): Promise<unknown> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("username_pet_saves")
    .select("state")
    .eq("username", normalizeUsername(username))
    .maybeSingle();
  if (error) throw error;
  return data === null ? null : data.state;
}

export async function saveToCloud(username: string, state: PetSave): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("username_pet_saves").upsert(
    {
      username: normalizeUsername(username),
      state,
      schema_version: state.version,
      updated_at: state.updatedAt,
    },
    { onConflict: "username" },
  );
  if (error) throw error;
}

export async function deleteCloudSave(username: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("username_pet_saves")
    .delete()
    .eq("username", normalizeUsername(username));
  if (error) throw error;
}
