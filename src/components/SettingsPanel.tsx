import { useEffect, useRef, useState } from "react";
import type { AppUser, PetSave, SyncStatus } from "../types";
import { playSound } from "../lib/sound";

function HoldToRestart({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setProgress(0);
  }

  function start() {
    if (disabled || timerRef.current !== null) return;
    startRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const next = Math.min(100, ((Date.now() - startRef.current) / 1800) * 100);
      setProgress(next);
      if (next >= 100) {
        stop();
        onConfirm();
      }
    }, 32);
  }

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  return (
    <button
      className="hold-button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onBlur={stop}
      onKeyDown={event => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); start(); } }}
      onKeyUp={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); stop(); } }}
    >
      <span style={{ width: `${progress}%` }} />
      <b>{progress > 0 ? "Keep holding…" : "Hold to restart"}</b>
    </button>
  );
}

function formatLastSaved(value: string | null, now: number): string {
  if (!value) return "Not saved yet";
  const elapsedMinutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return "Last saved just now";
  if (elapsedMinutes < 60) return `Last saved ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Last saved ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  return `Last saved ${new Date(value).toLocaleDateString([], { day: "numeric", month: "short" })}`;
}

interface SettingsPanelProps {
  user: AppUser;
  save: PetSave;
  syncStatus: SyncStatus;
  onRetrySync: () => Promise<void>;
  onClose: () => void;
  onRestart: () => void;
  onLogout: () => void;
  busy: boolean;
  error: string;
}

export function SettingsPanel({ user, save, syncStatus, onRetrySync, onClose, onRestart, onLogout, busy, error }: SettingsPanelProps) {
  const [sound, setSound] = useState(() => { try { return localStorage.getItem("kpf:sound") === "on"; } catch { return false; } });
  const [soundError, setSoundError] = useState("");
  const [restartOpen, setRestartOpen] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function toggleSound() {
    const next = !sound;
    try {
      localStorage.setItem("kpf:sound", next ? "on" : "off");
      setSound(next); setSoundError("");
      if (next) playSound("tap");
    } catch { setSoundError("Your browser couldn’t keep that setting. Sound is still off."); }
  }

  return (
    <main className="settings-shell">
      <header className="screen-heading"><button disabled={busy} onClick={onClose} className="back-button">‹ Room</button><div><p>Make it yours</p><h1>Settings</h1></div><span /></header>
      <section className="settings-list">
        <article className="account-card">
          <div className="account-card__icon" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</div>
          <div className="account-card__copy">
            <span>Playing as</span>
            <strong>{user.username}</strong>
            <small className={`account-save account-save--${syncStatus.phase}`}>
              {syncStatus.phase === "saving"
                ? "Saving to cloud…"
                : syncStatus.phase === "error"
                  ? "Save needs attention · please retry"
                  : user.cloud
                    ? "Cloud save connected"
                    : "Local preview on this phone"}
            </small>
            <small>{formatLastSaved(syncStatus.lastSavedAt, clock)}</small>
          </div>
          {syncStatus.phase === "error" && (
            <button className="retry-button" disabled={busy} onClick={() => void onRetrySync()}>Retry</button>
          )}
        </article>
        <button className="setting-row" role="switch" aria-checked={sound} disabled={busy} onClick={toggleSound}><span><strong>Sound effects</strong><small>Soft little notes · off by default</small></span><b aria-hidden="true" className={`toggle ${sound ? "is-on" : ""}`}><i /></b></button>
        {soundError && <p className="form-error" role="alert">{soundError}</p>}
        <button className="setting-row" disabled={busy} aria-expanded={restartOpen} onClick={() => setRestartOpen((open) => !open)}><span><strong>Restart companion</strong><small>Return to the adoption screen</small></span><b>›</b></button>
        {restartOpen && (
          <div className="restart-panel">
            <h2>Restart with a new friend?</h2>
            <p>This removes {save.petName}, coins, scores, keepsakes and unlocked items. You can return with the same username.</p>
            <label><span>Type “{save.petName}” to continue</span><input disabled={busy} value={typedName} onChange={(event) => setTypedName(event.target.value)} /></label>
            <HoldToRestart disabled={busy || typedName !== save.petName} onConfirm={onRestart} />
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {busy && <p role="status">Taking care of your save…</p>}
        <button className="setting-row" disabled={busy} onClick={onLogout}><span><strong>Switch username</strong><small>Your saved friend will still be here</small></span><b>›</b></button>
      </section>
      <p className="version-note">Katie’s Pixel Friend · Little Keepsakes Edition</p>
    </main>
  );
}
