import { useCallback, useEffect, useRef, useState } from "react";
import { AdoptionScreen } from "./components/AdoptionScreen";
import { GameHub } from "./components/GameHub";
import { LoginScreen } from "./components/LoginScreen";
import { PetRoom } from "./components/PetRoom";
import { SettingsPanel } from "./components/SettingsPanel";
import { ShopPanel } from "./components/ShopPanel";
import { applyTimeDecay, awardGame, createPetSave } from "./lib/gameState";
import { deleteCloudSave, forgetUsername, restoreUser } from "./lib/supabase";
import { deleteLocalSave, loadBestSave, saveLocally, syncSave } from "./lib/storage";
import type { AppUser, PetKind, PetSave, SyncStatus } from "./types";

type Screen = "room" | "games" | "shop" | "settings";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [save, setSave] = useState<PetSave | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("room");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ phase: "saved", lastSavedAt: null });
  const didLoadRef = useRef(false);

  useEffect(() => {
    const restored = restoreUser();
    setUser(restored);
    if (!restored) setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadBestSave(user).then((loaded) => {
      const next = loaded ? applyTimeDecay(loaded) : null;
      setSave(next);
      if (next) saveLocally(user.id, next);
      setSyncStatus({
        phase: user.cloud ? "saved" : "local",
        lastSavedAt: next?.updatedAt ?? null,
      });
      didLoadRef.current = true;
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !save || !didLoadRef.current) return;
    saveLocally(user.id, save);
    if (!user.cloud) {
      setSyncStatus({ phase: "local", lastSavedAt: save.updatedAt });
      return;
    }
    setSyncStatus((current) => ({ ...current, phase: "saving" }));
    let cancelled = false;
    const timer = window.setTimeout(() => {
      syncSave(user, save)
        .then(() => {
          if (!cancelled) setSyncStatus({ phase: "saved", lastSavedAt: save.updatedAt });
        })
        .catch(() => {
          if (!cancelled) setSyncStatus((current) => ({ ...current, phase: "error" }));
        });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [save, user]);

  const changeSave = useCallback((next: PetSave) => setSave(next), []);

  function adopt(kind: PetKind, name: string) {
    setSave(createPetSave(kind, name));
    setScreen("room");
  }

  function gameAward(gameId: string, score: number, coins: number) {
    setSave((current) => current ? awardGame(current, gameId, score, coins) : current);
  }

  async function retrySync() {
    if (!user || !save) return;
    saveLocally(user.id, save);
    if (!user.cloud) {
      setSyncStatus({ phase: "local", lastSavedAt: save.updatedAt });
      return;
    }
    setSyncStatus((current) => ({ ...current, phase: "saving" }));
    try {
      await syncSave(user, save);
      setSyncStatus({ phase: "saved", lastSavedAt: save.updatedAt });
    } catch {
      setSyncStatus((current) => ({ ...current, phase: "error" }));
    }
  }

  function logout() {
    forgetUsername();
    didLoadRef.current = false;
    setUser(null);
    setSave(null);
    setScreen("room");
    setSyncStatus({ phase: "saved", lastSavedAt: null });
  }

  async function restart() {
    if (!user) return;
    deleteLocalSave(user.id);
    if (user.cloud) await deleteCloudSave(user.id).catch(() => undefined);
    setSave(null);
    setScreen("room");
  }

  if (loading) return <div className="loading-screen"><span /><p>Waking up a tiny world…</p></div>;
  if (!user) return <LoginScreen onLogin={setUser} />;
  if (!save) return <AdoptionScreen onAdopt={adopt} />;
  if (screen === "games") return <GameHub save={save} onAward={gameAward} onClose={() => setScreen("room")} />;
  if (screen === "shop") return <ShopPanel save={save} onChange={changeSave} onClose={() => setScreen("room")} />;
  if (screen === "settings") return <SettingsPanel user={user} save={save} syncStatus={syncStatus} onRetrySync={retrySync} onClose={() => setScreen("room")} onRestart={restart} onLogout={logout} />;
  return <PetRoom save={save} syncStatus={syncStatus} onChange={changeSave} onGames={() => setScreen("games")} onShop={() => setScreen("shop")} onSettings={() => setScreen("settings")} />;
}
