import { useEffect, useRef, useState } from "react";
import type { PetSave } from "../types";

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
    if (disabled) return;
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
    >
      <span style={{ width: `${progress}%` }} />
      <b>{progress > 0 ? "Keep holding…" : "Hold to restart"}</b>
    </button>
  );
}

export function SettingsPanel({ save, onClose, onRestart, onLogout }: { save: PetSave; onClose: () => void; onRestart: () => void; onLogout: () => void }) {
  const [sound, setSound] = useState(() => localStorage.getItem("kpf:sound") === "on");
  const [restartOpen, setRestartOpen] = useState(false);
  const [typedName, setTypedName] = useState("");

  function toggleSound() {
    setSound((current) => {
      const next = !current;
      localStorage.setItem("kpf:sound", next ? "on" : "off");
      return next;
    });
  }

  return (
    <main className="settings-shell">
      <header className="screen-heading"><button onClick={onClose} className="back-button">‹ Room</button><div><p>Make it yours</p><h1>Settings</h1></div><span /></header>
      <section className="settings-list">
        <button className="setting-row" onClick={toggleSound}><span><strong>Sound effects</strong><small>Starts muted on this phone</small></span><b className={`toggle ${sound ? "is-on" : ""}`}><i /></b></button>
        <button className="setting-row" onClick={() => setRestartOpen((open) => !open)}><span><strong>Restart companion</strong><small>Return to the adoption screen</small></span><b>›</b></button>
        {restartOpen && (
          <div className="restart-panel">
            <h2>Restart with a new friend?</h2>
            <p>This removes {save.petName}, coins, scores and unlocked items. Your login remains.</p>
            <label><span>Type “{save.petName}” to continue</span><input value={typedName} onChange={(event) => setTypedName(event.target.value)} /></label>
            <HoldToRestart disabled={typedName !== save.petName} onConfirm={onRestart} />
          </div>
        )}
        <button className="setting-row" onClick={onLogout}><span><strong>Sign out</strong><small>Your saved friend will still be here</small></span><b>›</b></button>
      </section>
      <p className="version-note">Katie’s Pixel Friend · Friday edition</p>
    </main>
  );
}
