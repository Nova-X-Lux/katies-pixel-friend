import { describe, expect, it } from "vitest";
import { isValidUsername, normalizeUsername } from "./supabase";

describe("username-only access", () => {
  it("uses a case-insensitive username as the save key", () => {
    expect(normalizeUsername("  KaTiE  ")).toBe("katie");
  });

  it("accepts simple usernames and rejects unsafe values", () => {
    expect(isValidUsername("katie")).toBe(true);
    expect(isValidUsername("nova-x_lux")).toBe(true);
    expect(isValidUsername("katie@example.com")).toBe(false);
    expect(isValidUsername("two words")).toBe(false);
    expect(isValidUsername("a".repeat(25))).toBe(false);
  });
});
