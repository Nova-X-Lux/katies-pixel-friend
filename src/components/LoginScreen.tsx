import { useState, type FormEvent } from "react";
import { enterWithUsername, isCloudConfigured } from "../lib/supabase";
import type { AppUser } from "../types";
import { PixelIcon } from "./PixelIcon";

export function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onLogin(await enterWithUsername(username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark"><PixelIcon name="heart" size={42} /></div>
        <p className="brand-kicker">A tiny world made just for Katie</p>
        <h1 id="login-title">Katie’s Pixel Friend</h1>
        <p className="login-copy">Your little companion is waiting inside.</p>

        {!isCloudConfigured && import.meta.env.DEV && (
          <p className="preview-note">Local preview: use the same username to return to the same friend.</p>
        )}

        <form onSubmit={submit} className="login-form">
          <label>
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              inputMode="text"
              autoCapitalize="none"
              maxLength={24}
              aria-describedby="username-hint"
              required
            />
          </label>
          <p id="username-hint" className="username-hint">No password needed. Use the same username each time.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>
            {busy ? "Opening the door…" : "Meet my friend"}
          </button>
        </form>
      </section>
    </main>
  );
}
