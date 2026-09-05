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

export function restoreUser(): AppUser | null {
  const username = localStorage.getItem(lastUsernameKey);
  if (!username || !isValidUsername(username)) return null;
  const cleaned = normalizeUsername(username);
  return { id: cleaned, username: cleaned, cloud: isCloudConfigured };
}

export async function enterWithUsername(username: string): Promise<AppUser> {
  const cleaned = normalizeUsername(username);
  if (!isValidUsername(cleaned)) {
    throw new Error("Use 1–24 letters, numbers, underscores or hyphens.");
  }

  if (!supabase) {
    if (!import.meta.env.DEV) throw new Error("Cloud saving has not been connected yet.");
    localStorage.setItem(lastUsernameKey, cleaned);
    return { id: `preview-${cleaned}`, username: username.trim(), cloud: false };
  }

  localStorage.setItem(lastUsernameKey, cleaned);
  return { id: cleaned, username: cleaned, cloud: true };
}

export function forgetUsername(): void {
  localStorage.removeItem(lastUsernameKey);
}

export async function loadCloudSave(username: string): Promise<PetSave | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("username_pet_saves")
    .select("state")
    .eq("username", normalizeUsername(username))
    .maybeSingle();
  if (error) throw error;
  return (data?.state as PetSave | undefined) ?? null;
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
