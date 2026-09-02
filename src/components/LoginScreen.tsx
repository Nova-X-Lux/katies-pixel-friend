import { useState, type FormEvent } from "react";
import { isCloudConfigured, signIn } from "../lib/supabase";
import type { AppUser } from "../types";
import { PixelIcon } from "./PixelIcon";

export function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onLogin(await signIn(username, password));
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
          <p className="preview-note">Local preview: use any username and a password of 6+ characters.</p>
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
              required
            />
          </label>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-field">
              <input
                id="login-password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>
            {busy ? "Opening the door…" : "Enter"}
          </button>
        </form>
      </section>
    </main>
  );
}
