import { useCallback, useEffect, useRef, useState } from "react";
import { AdoptionScreen } from "./components/AdoptionScreen";
import { GameHub } from "./components/GameHub";
import { KeepsakeBook } from "./components/KeepsakeBook";
import { LoginScreen } from "./components/LoginScreen";
import { PetRoom } from "./components/PetRoom";
import { SettingsPanel } from "./components/SettingsPanel";
import { ShopPanel } from "./components/ShopPanel";
import { applyTimeDecay, awardGame, createPetSave } from "./lib/gameState";
import { deleteCloudSave, forgetUsername, restoreUser } from "./lib/supabase";
import { deleteLocalSave, loadBestSave, saveLocally, syncSave } from "./lib/storage";
import type { AppUser, PetKind, PetSave, SyncStatus } from "./types";

type Screen = "room" | "games" | "shop" | "settings" | "book";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => restoreUser());
  const [save, setSave] = useState<PetSave | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [screen, setScreen] = useState<Screen>("room");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ phase: "saved", lastSavedAt: null });
  const didLoadRef = useRef(false);
  const savingBlocked = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const generation = useRef(0);
  const loadedUserId = useRef<string | null>(null);
  const latestSave = useRef(save);
  latestSave.current = save;
  const renderGeneration = generation.current;

  const enqueue = useCallback(<T,>(work: () => Promise<T>): Promise<T> => {
    const next = queue.current.then(work, work);
    queue.current = next.catch(() => undefined);
    return next;
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadGeneration = ++generation.current;
    didLoadRef.current = false;
    loadedUserId.current = null;
    setSave(null); setLoading(true); setLoadError("");
    void queue.current.then(() => loadBestSave(user)).then(loaded => {
      if (cancelled || generation.current !== loadGeneration) return;
      if (loaded.cloudFailed) throw new Error("We couldn’t reach your saved friend. Check your connection and try again.");
      const next = loaded.save ? applyTimeDecay(loaded.save) : null;
      setSave(next);
      setSyncStatus({ phase: user.cloud ? "saved" : "local", lastSavedAt: loaded.save?.updatedAt ?? null });
      loadedUserId.current = user.id;
      didLoadRef.current = true;
    }).catch(cause => {
      if (!cancelled && generation.current === loadGeneration) setLoadError(cause instanceof Error ? cause.message : "Your friend couldn’t be loaded. Please try again.");
    }).finally(() => { if (!cancelled && generation.current === loadGeneration) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, reload]);

  useEffect(() => {
    if (!user || !save || !didLoadRef.current || loadedUserId.current !== user.id || savingBlocked.current) return;
    let locallySaved = false;
    try { saveLocally(user.id, save); locallySaved = true; } catch { /* Cloud saving may still be available. */ }
    if (!user.cloud) {
      setSyncStatus({ phase: locallySaved ? "local" : "error", lastSavedAt: locallySaved ? save.updatedAt : null });
      return;
    }
    setSyncStatus(current => ({ ...current, phase: "saving" }));
    let cancelled = false;
    const currentGeneration = generation.current;
    const timer = window.setTimeout(() => {
      void enqueue(async () => {
        if (savingBlocked.current || generation.current !== currentGeneration) return;
        await syncSave(user, save);
        if (!cancelled && generation.current === currentGeneration && !savingBlocked.current) setSyncStatus({ phase: "saved", lastSavedAt: save.updatedAt });
      }).catch(() => { if (!cancelled && generation.current === currentGeneration && !savingBlocked.current) setSyncStatus(current => ({ ...current, phase: "error" })); });
    }, 450);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [save, user, enqueue]);

  useEffect(() => {
    const tick = () => { if (!document.hidden && didLoadRef.current && !savingBlocked.current) setSave(current => current ? applyTimeDecay(current) : current); };
    const timer = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, []);

  function canChangeSave() {
    return Boolean(user && didLoadRef.current && loadedUserId.current === user.id
      && generation.current === renderGeneration && !savingBlocked.current);
  }
  function changeSave(next: PetSave) { if (canChangeSave()) setSave(next); }
  function adopt(kind: PetKind, name: string) {
    if (!canChangeSave() || latestSave.current) return;
    setSave(createPetSave(kind, name)); setScreen("room");
  }
  function gameAward(gameId: string, score: number, coins: number) {
    if (canChangeSave()) setSave(current => current ? awardGame(current, gameId, score, coins) : current);
  }

  async function retrySync() {
    if (!user || !save || !canChangeSave()) return;
    const currentGeneration = generation.current;
    setSyncStatus(current => ({ ...current, phase: "saving" }));
    try {
      await enqueue(async () => {
        if (savingBlocked.current || generation.current !== currentGeneration) return;
        await syncSave(user, save);
      });
      if (!savingBlocked.current && generation.current === currentGeneration && latestSave.current === save) {
        setSyncStatus({ phase: user.cloud ? "saved" : "local", lastSavedAt: save.updatedAt });
      }
    } catch {
      if (!savingBlocked.current && generation.current === currentGeneration) setSyncStatus(current => ({ ...current, phase: "error" }));
    }
  }

  async function logout() {
    if (busy || savingBlocked.current) return;
    savingBlocked.current = true; setBusy(true); setActionError("");
    try {
      if (user && latestSave.current && didLoadRef.current) {
        const finalSave = latestSave.current;
        await enqueue(() => syncSave(user, finalSave));
      }
      generation.current += 1;
      forgetUsername(); didLoadRef.current = false; loadedUserId.current = null;
      setUser(null); setSave(null); setLoadError(""); setScreen("room"); setLoading(false);
    } catch { setActionError("Your latest changes haven’t reached your save yet. Check your connection and try switching again."); }
    finally { savingBlocked.current = false; setBusy(false); }
  }

  async function restart() {
    if (!user || busy || !canChangeSave()) return;
    savingBlocked.current = true; setBusy(true); setActionError("");
    const previous = latestSave.current;
    try {
      await enqueue(async () => {
        deleteLocalSave(user.id);
        try { if (user.cloud) await deleteCloudSave(user.id); }
        catch (cause) { if (previous) saveLocally(user.id, previous); throw cause; }
      });
      generation.current += 1;
      setSave(null); setScreen("room");
      setSyncStatus({ phase: user.cloud ? "saved" : "local", lastSavedAt: null });
    } catch { setActionError("We couldn’t restart your companion. Your current friend is still here; check your connection and try again."); }
    finally { savingBlocked.current = false; setBusy(false); }
  }

  if (loading) return <div className="loading-screen"><span /><p>Waking up a tiny world…</p></div>;
  if (loadError) return <main className="auth-shell"><section className="login-card"><h1>A moment, please.</h1><p role="alert">{loadError}</p><p>Your existing save is being kept safe.</p><button className="primary-button" onClick={() => setReload(n => n + 1)}>Try again</button><button className="text-button" onClick={() => void logout()}>Use another username</button></section></main>;
  if (!user) return <LoginScreen onLogin={next => { setLoading(true); setUser(next); }} />;
  if (!save) return <AdoptionScreen onAdopt={adopt} onSwitch={() => void logout()} />;
  if (screen === "games") return <GameHub save={save} onAward={gameAward} onClose={() => setScreen("room")} />;
  if (screen === "shop") return <ShopPanel save={save} onChange={changeSave} onClose={() => setScreen("room")} />;
  if (screen === "book") return <KeepsakeBook save={save} onChange={changeSave} onClose={() => setScreen("room")} onPlay={() => setScreen("games")} />;
  if (screen === "settings") return <SettingsPanel user={user} save={save} syncStatus={syncStatus} onRetrySync={retrySync} onClose={() => setScreen("room")} onRestart={() => void restart()} onLogout={() => void logout()} busy={busy} error={actionError} />;
  return <PetRoom save={save} syncStatus={syncStatus} onChange={changeSave} onGames={() => setScreen("games")} onShop={() => setScreen("shop")} onSettings={() => { setActionError(""); setScreen("settings"); }} onBook={() => setScreen("book")} />;
}
