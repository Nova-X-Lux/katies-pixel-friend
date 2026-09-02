import { createClient } from "@supabase/supabase-js";
import type { AppUser, PetSave } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const aliasDomain = import.meta.env.VITE_AUTH_ALIAS_DOMAIN?.trim() || "pixel-friend.example";

export const isCloudConfigured = Boolean(url && publishableKey);

export const supabase = isCloudConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

function normalizeUsername(username: string): string {
  return username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
}

function aliasEmail(username: string): string {
  return `${normalizeUsername(username)}@${aliasDomain}`;
}

export async function restoreCloudUser(): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  const username = localStorage.getItem("kpf:last-username") || "Katie";
  return { id: data.session.user.id, username, cloud: true };
}

export async function signIn(username: string, password: string): Promise<AppUser> {
  const cleaned = normalizeUsername(username);
  if (!cleaned || password.length < 6) {
    throw new Error("Enter a username and a password with at least 6 characters.");
  }

  if (!supabase) {
    if (!import.meta.env.DEV) throw new Error("Cloud login has not been connected yet.");
    localStorage.setItem("kpf:last-username", username.trim());
    return { id: `preview-${cleaned}`, username: username.trim(), cloud: false };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: aliasEmail(cleaned),
    password,
  });
  if (error || !data.user) throw new Error("That username or password was not recognised.");
  localStorage.setItem("kpf:last-username", username.trim());
  return { id: data.user.id, username: username.trim(), cloud: true };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export async function loadCloudSave(userId: string): Promise<PetSave | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pet_saves")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.state as PetSave | undefined) ?? null;
}

export async function saveToCloud(userId: string, state: PetSave): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("pet_saves").upsert(
    {
      user_id: userId,
      state,
      schema_version: state.version,
      updated_at: state.updatedAt,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function deleteCloudSave(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("pet_saves").delete().eq("user_id", userId);
  if (error) throw error;
}
