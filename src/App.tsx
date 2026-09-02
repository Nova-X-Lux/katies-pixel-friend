import { useCallback, useEffect, useRef, useState } from "react";
import { AdoptionScreen } from "./components/AdoptionScreen";
import { GameHub } from "./components/GameHub";
import { LoginScreen } from "./components/LoginScreen";
import { PetRoom } from "./components/PetRoom";
import { SettingsPanel } from "./components/SettingsPanel";
import { applyTimeDecay, awardGame, createPetSave } from "./lib/gameState";
import { deleteCloudSave, restoreCloudUser, signOut } from "./lib/supabase";
import { deleteLocalSave, loadBestSave, saveLocally, syncSave } from "./lib/storage";
import type { AppUser, PetKind, PetSave } from "./types";

type Screen = "room" | "games" | "settings";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [save, setSave] = useState<PetSave | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("room");
  const [syncState, setSyncState] = useState<"saved" | "saving" | "offline">("saved");
  const didLoadRef = useRef(false);

  useEffect(() => {
    restoreCloudUser().then((restored) => {
      setUser(restored);
      if (!restored) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadBestSave(user).then((loaded) => {
      const next = loaded ? applyTimeDecay(loaded) : null;
      setSave(next);
      if (next) saveLocally(user.id, next);
      didLoadRef.current = true;
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !save || !didLoadRef.current) return;
    saveLocally(user.id, save);
    setSyncState(user.cloud ? "saving" : "offline");
    const timer = window.setTimeout(() => {
      syncSave(user, save)
        .then(() => setSyncState(user.cloud ? "saved" : "offline"))
        .catch(() => setSyncState("offline"));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [save, user]);

  const changeSave = useCallback((next: PetSave) => setSave(next), []);

  function adopt(kind: PetKind, name: string) {
    setSave(createPetSave(kind, name));
    setScreen("room");
  }

  function gameAward(gameId: string, score: number, coins: number) {
    setSave((current) => current ? awardGame(current, gameId, score, coins) : current);
  }

  async function logout() {
    await signOut();
    didLoadRef.current = false;
    setUser(null);
    setSave(null);
    setScreen("room");
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
  if (screen === "settings") return <SettingsPanel save={save} onClose={() => setScreen("room")} onRestart={restart} onLogout={logout} />;
  return <PetRoom save={save} syncState={syncState} onChange={changeSave} onGames={() => setScreen("games")} onSettings={() => setScreen("settings")} />;
}
