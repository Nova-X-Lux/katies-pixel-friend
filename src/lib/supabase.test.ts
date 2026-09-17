import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  vi.stubEnv("DEV", true);
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("username-only access", () => {
  it("uses a case-insensitive username as the save key", async () => {
    const { normalizeUsername } = await import("./supabase");
    expect(normalizeUsername("  KaTiE  ")).toBe("katie");
  });

  it("accepts simple usernames and rejects unsafe values", async () => {
    const { isValidUsername } = await import("./supabase");
    expect(isValidUsername("katie")).toBe(true);
    expect(isValidUsername("nova-x_lux")).toBe(true);
    expect(isValidUsername("katie@example.com")).toBe(false);
    expect(isValidUsername("two words")).toBe(false);
    expect(isValidUsername("a".repeat(25))).toBe(false);
  });

  it("restores the identical preview save identity after reopening", async () => {
    const { enterWithUsername, restoreUser } = await import("./supabase");
    const user = await enterWithUsername("  KaTiE  ");
    expect(user).toEqual({ id: "preview-katie", username: "katie", cloud: false });
    expect(restoreUser()).toEqual(user);
  });

  it("keeps cloud users on their existing normalized identity", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-key");
    const { enterWithUsername, restoreUser } = await import("./supabase");
    const user = await enterWithUsername("  KaTiE  ");
    expect(user).toEqual({ id: "katie", username: "katie", cloud: true });
    expect(restoreUser()).toEqual(user);
  });

  it("forgets the previous username when switching accounts", async () => {
    const { enterWithUsername, restoreUser, forgetUsername } = await import("./supabase");
    await enterWithUsername("katie");
    forgetUsername();
    expect(restoreUser()).toBeNull();
    await enterWithUsername("nova");
    expect(restoreUser()?.id).toBe("preview-nova");
  });

  it("handles storage restrictions without claiming a durable preview session", async () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error("blocked"); });
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error("blocked"); });
    const { enterWithUsername, restoreUser } = await import("./supabase");
    expect(restoreUser()).toBeNull();
    await expect(enterWithUsername("katie")).rejects.toThrow("cannot save");
  });

  it("allows a cloud session when the browser cannot remember its username", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-key");
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error("blocked"); });
    const { enterWithUsername } = await import("./supabase");
    await expect(enterWithUsername("katie")).resolves.toEqual({ id: "katie", username: "katie", cloud: true });
  });
});
