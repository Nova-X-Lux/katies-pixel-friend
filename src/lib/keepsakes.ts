import type { DailyActivity, Keepsakes, PetSave, PixelIconName } from "../types";

export const DAILY_TASKS: { id: DailyActivity; title: string; detail: string; icon: PixelIconName }[] = [
  { id: "pet", title: "A little hello", detail: "Give your friend a gentle pet.", icon: "heart" },
  { id: "wash", title: "Fresh paws", detail: "Freshen up in the Care menu.", icon: "sparkle" },
  { id: "play", title: "Playtime for two", detail: "Finish a round of any game.", icon: "controller" },
];

export const ROOM_THEMES = [
  { id: "rose", name: "Rose cottage", detail: "The pink room you came home to.", cost: 0, wall: "#dca2b1", floor: "#8e6873" },
  { id: "sage", name: "Garden room", detail: "Sage walls and honey-coloured wood.", cost: 35, wall: "#bac8ae", floor: "#ad8869" },
  { id: "lavender", name: "Lilac evening", detail: "Lavender walls, plum floorboards.", cost: 45, wall: "#c8b8dd", floor: "#80718e" },
  { id: "peach", name: "Peaches & cream", detail: "Apricot walls with warm oak below.", cost: 35, wall: "#efc49f", floor: "#aa7b64" },
];

export const STAMPS: { id: string; title: string; hint: string; icon: PixelIconName; unlocked: (s: PetSave) => boolean }[] = [
  { id: "home", title: "Home at last", hint: "Choose your little friend.", icon: "shop", unlocked: () => true },
  { id: "play", title: "Just one more", hint: "Finish your first game.", icon: "controller", unlocked: s => s.keepsakes.gamesPlayed >= 1 },
  { id: "friend", title: "Getting to know you", hint: "Earn 30 friendship hearts.", icon: "heart", unlocked: s => s.keepsakes.friendship >= 30 },
  { id: "snack", title: "Snack critic", hint: "Try all three of your pet’s foods.", icon: "apple", unlocked: s => Object.keys(s.keepsakes.foodCounts).length >= 3 },
  { id: "room", title: "Made it mine", hint: "Own three room decorations.", icon: "flower", unlocked: s => s.unlockedDecorations.length >= 3 },
  { id: "ten-games", title: "Dream team", hint: "Finish ten games together.", icon: "star", unlocked: s => s.keepsakes.gamesPlayed >= 10 },
  { id: "close", title: "Favourite company", hint: "Earn 100 friendship hearts.", icon: "yarn", unlocked: s => s.keepsakes.friendship >= 100 },
  { id: "week", title: "Our little routine", hint: "Say hello on seven different days.", icon: "moon", unlocked: s => s.keepsakes.careDays >= 7 },
];

export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function createKeepsakes(now = new Date()): Keepsakes {
  return { friendship: 0, gamesPlayed: 0, careDays: 0, foodCounts: {},
    daily: { date: localDay(now), activities: [], claimed: [], parcelOpened: false },
    stamps: {}, themes: ["rose"], theme: "rose" };
}

const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1_000_000, Math.floor(v))) : 0;
const activities: DailyActivity[] = ["pet", "wash", "play", "feed", "nap", "decorate"];
export function migrateKeepsakes(value: unknown): Keepsakes {
  const v = record(value), d = record(v.daily);
  const defaults = createKeepsakes();
  const ownedThemes: unknown[] = Array.isArray(v.themes) ? v.themes : [];
  const themes = ROOM_THEMES.filter(t => ownedThemes.includes(t.id)).map(t => t.id);
  if (!themes.includes("rose")) themes.unshift("rose");
  return {
    friendship: count(v.friendship), gamesPlayed: count(v.gamesPlayed), careDays: count(v.careDays),
    foodCounts: Object.fromEntries(Object.entries(record(v.foodCounts)).filter(([key, n]) => key.length <= 60 && count(n) > 0).slice(0, 12).map(([key, n]) => [key, count(n)])),
    daily: {
      date: typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : defaults.daily.date,
      activities: activities.filter(a => Array.isArray(d.activities) && d.activities.includes(a)),
      claimed: DAILY_TASKS.filter(t => Array.isArray(d.claimed) && d.claimed.includes(t.id)).map(t => t.id),
      parcelOpened: d.parcelOpened === true,
    },
    stamps: Object.fromEntries(Object.entries(record(v.stamps)).filter((entry): entry is [string, string] => STAMPS.some(s => s.id === entry[0]) && typeof entry[1] === "string" && !Number.isNaN(Date.parse(entry[1])))),
    themes, theme: typeof v.theme === "string" && themes.includes(v.theme) ? v.theme : "rose",
  };
}

export function dailyFor(save: PetSave, now = new Date()): Keepsakes["daily"] {
  // Rolling the clock backwards must not reopen already claimed rewards.
  return save.keepsakes.daily.date >= localDay(now) ? save.keepsakes.daily : createKeepsakes(now).daily;
}

export function stampMilestones(save: PetSave, now = new Date()): PetSave {
  const missing = STAMPS.filter(s => !save.keepsakes.stamps[s.id] && s.unlocked(save));
  if (!missing.length) return save;
  return { ...save, keepsakes: { ...save.keepsakes, stamps: { ...save.keepsakes.stamps,
    ...Object.fromEntries(missing.map(s => [s.id, s.id === "home" ? save.createdAt : now.toISOString()])) } } };
}

export function recordActivity(save: PetSave, activity: DailyActivity, now = new Date(), food?: string): PetSave {
  const daily = dailyFor(save, now);
  const first = !daily.activities.includes(activity);
  return stampMilestones({ ...save, keepsakes: { ...save.keepsakes,
    friendship: save.keepsakes.friendship + (first ? 5 : 0),
    careDays: save.keepsakes.careDays + (activity === "pet" && first ? 1 : 0),
    gamesPlayed: save.keepsakes.gamesPlayed + (activity === "play" ? 1 : 0),
    foodCounts: food ? { ...save.keepsakes.foodCounts, [food]: (save.keepsakes.foodCounts[food] ?? 0) + 1 } : save.keepsakes.foodCounts,
    daily: { ...daily, activities: first ? [...daily.activities, activity] : daily.activities },
  } }, now);
}

export function claimDailyTask(save: PetSave, task: string, now = new Date()): PetSave {
  const daily = dailyFor(save, now);
  const definition = DAILY_TASKS.find(t => t.id === task);
  if (!definition || !daily.activities.includes(definition.id) || daily.claimed.includes(task)) return save;
  return { ...save, coins: save.coins + 5, updatedAt: now.toISOString(),
    keepsakes: { ...save.keepsakes, daily: { ...daily, claimed: [...daily.claimed, task] } } };
}

export function openDailyParcel(save: PetSave, now = new Date()): PetSave {
  const daily = dailyFor(save, now);
  if (daily.parcelOpened || !DAILY_TASKS.every(t => daily.claimed.includes(t.id))) return save;
  return { ...save, coins: save.coins + 10, updatedAt: now.toISOString(),
    keepsakes: { ...save.keepsakes, daily: { ...daily, parcelOpened: true } } };
}

export function chooseRoomTheme(save: PetSave, id: string, now = new Date()): PetSave {
  const theme = ROOM_THEMES.find(t => t.id === id);
  if (!theme || id === save.keepsakes.theme) return save;
  const owned = save.keepsakes.themes.includes(id);
  if (!owned && save.coins < theme.cost) return save;
  return recordActivity({ ...save, coins: save.coins - (owned ? 0 : theme.cost), updatedAt: now.toISOString(),
    keepsakes: { ...save.keepsakes, theme: id, themes: owned ? save.keepsakes.themes : [...save.keepsakes.themes, id] } }, "decorate", now);
}

export function friendshipLevel(hearts: number) {
  const stages = [{ at: 0, name: "New neighbours" }, { at: 30, name: "Little pals" }, { at: 100, name: "Favourite company" }, { at: 250, name: "Home is together" }];
  const index = Math.max(0, stages.filter(s => hearts >= s.at).length - 1);
  const stage = stages[Math.max(0, index)], next = stages[index + 1];
  return { name: stage.name, hearts, next: next?.at ?? null,
    progress: next ? Math.min(100, Math.round((hearts - stage.at) / (next.at - stage.at) * 100)) : 100 };
}
