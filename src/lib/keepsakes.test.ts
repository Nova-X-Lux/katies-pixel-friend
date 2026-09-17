import { describe, expect, it } from "vitest";
import { createPetSave } from "./gameState";
import { claimDailyTask, createKeepsakes, dailyFor, friendshipLevel, localDay, migrateKeepsakes, openDailyParcel, recordActivity, chooseRoomTheme } from "./keepsakes";

const today = new Date(2026, 8, 17, 12);
const tomorrow = new Date(2026, 8, 18, 12);
function starter() { const s = createPetSave("cat", "Mochi"); return { ...s, keepsakes: createKeepsakes(today) }; }

describe("little keepsakes", () => {
  it("does not reward incomplete or unknown tasks", () => {
    const s = starter();
    expect(claimDailyTask(s, "pet", today)).toBe(s);
    expect(claimDailyTask(s, "made-up", today)).toBe(s);
    expect(openDailyParcel(s, today)).toBe(s);
  });
  it("each daily reward and the parcel can only be collected once", () => {
    let s = starter();
    for (const task of ["pet", "wash", "play"] as const) {
      s = recordActivity(s, task, today);
      s = claimDailyTask(s, task, today);
      expect(claimDailyTask(s, task, today)).toBe(s);
    }
    expect(s.coins).toBe(40);
    s = openDailyParcel(s, today);
    expect(s.coins).toBe(50);
    expect(openDailyParcel(s, today)).toBe(s);
    expect(s.keepsakes.gamesPlayed).toBe(1);
  });
  it("earns friendship once per activity each day, without losing hearts", () => {
    let s = recordActivity(starter(), "pet", today);
    s = recordActivity(s, "pet", today);
    expect(s.keepsakes.friendship).toBe(5);
    expect(s.keepsakes.careDays).toBe(1);
    s = recordActivity(s, "wash", today);
    expect(s.keepsakes.friendship).toBe(10);
    s = recordActivity(s, "pet", tomorrow);
    expect(s.keepsakes.friendship).toBe(15);
    expect(s.keepsakes.careDays).toBe(2);
    expect(dailyFor(s, new Date(2026, 9, 3)).activities).toEqual([]);
    expect(s.keepsakes.friendship).toBe(15);
  });
  it("resets activities on a new local day but not when the clock goes back", () => {
    let s = claimDailyTask(recordActivity(starter(), "pet", today), "pet", today);
    expect(localDay(today)).toBe("2026-09-17");
    expect(dailyFor(s, tomorrow).claimed).toEqual([]);
    expect(claimDailyTask(s, "pet", tomorrow)).toBe(s);
    s = claimDailyTask(recordActivity(s, "pet", tomorrow), "pet", tomorrow);
    expect(s.coins).toBe(35);
    expect(claimDailyTask(s, "pet", today)).toBe(s);
  });
  it("unlocks room colours permanently and never charges for swapping owned colours", () => {
    const s = { ...starter(), coins: 80 };
    const bought = chooseRoomTheme(s, "sage", today);
    expect(bought.coins).toBe(45);
    expect(bought.keepsakes.themes).toEqual(["rose", "sage"]);
    const switched = chooseRoomTheme(chooseRoomTheme(bought, "rose", today), "sage", today);
    expect(switched.coins).toBe(45);
    expect(switched.keepsakes.friendship).toBe(5);
    expect(chooseRoomTheme(starter(), "lavender", today).keepsakes.theme).toBe("rose");
    expect(chooseRoomTheme(s, "unknown", today)).toBe(s);
  });
  it("stamps milestones once and keeps their original date", () => {
    let s = recordActivity(starter(), "play", today);
    expect(s.keepsakes.stamps.play).toBe(today.toISOString());
    for (let n = 0; n < 9; n++) s = recordActivity(s, "play", tomorrow);
    expect(s.keepsakes.gamesPlayed).toBe(10);
    expect(s.keepsakes.stamps["ten-games"]).toBe(tomorrow.toISOString());
    expect(s.keepsakes.stamps.play).toBe(today.toISOString());
  });
  it("records food preferences and normalizes malformed legacy extras safely", () => {
    let s = recordActivity(starter(), "feed", today, "fish");
    s = recordActivity(s, "feed", today, "fish");
    expect(s.keepsakes.foodCounts.fish).toBe(2);
    const clean = migrateKeepsakes({ friendship: NaN, themes: ["lavender", "bad"], theme: "bad", daily: { claimed: ["pet", "pet", "bad"] }, stamps: { home: "bad", play: today.toISOString(), imaginary: today.toISOString() } });
    expect(clean.friendship).toBe(0);
    expect(clean.themes).toEqual(["rose", "lavender"]);
    expect(clean.theme).toBe("rose");
    expect(clean.daily.claimed).toEqual(["pet"]);
    expect(clean.stamps).toEqual({ play: today.toISOString() });
  });
  it("provides bounded progress at every friendship milestone", () => {
    expect(friendshipLevel(0)).toMatchObject({ name: "New neighbours", progress: 0 });
    expect(friendshipLevel(30)).toMatchObject({ name: "Little pals", progress: 0 });
    expect(friendshipLevel(100)).toMatchObject({ name: "Favourite company", progress: 0 });
    expect(friendshipLevel(500)).toMatchObject({ next: null, progress: 100 });
  });
});
