import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppUser } from "../types";
import { createPetSave } from "./gameState";
import { deleteLocalSave, loadBestSave, loadLocalSave, migrateSave, saveLocally, syncSave } from "./storage";
import { loadCloudSave, saveToCloud } from "./supabase";

vi.mock("./supabase", () => ({ loadCloudSave: vi.fn(), saveToCloud: vi.fn() }));

const cloudUser: AppUser = { id: "katie", username: "katie", cloud: true };
const previewUser: AppUser = { id: "preview-katie", username: "katie", cloud: false };
let values: Map<string, string>;

beforeEach(() => {
  vi.clearAllMocks();
  values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  });
  vi.mocked(loadCloudSave).mockResolvedValue(null);
  vi.mocked(saveToCloud).mockResolvedValue(undefined);
});

afterEach(() => vi.unstubAllGlobals());

describe("save migration", () => {
  it.each([1, 2])("upgrades version %i while retaining the pet's progress and adoption date", (version) => {
    const current = createPetSave("panda", "Bean");
    const previous = {
      ...current,
      version,
      coins: 182,
      createdAt: "2026-09-01T12:00:00.000Z",
      unlockedDecorations: ["heart-lamp", "rose-cushion"],
      selectedDecoration: "rose-cushion",
      highScores: { memory: 240 },
      keepsakes: undefined,
    };
    const migrated = migrateSave(previous);
    expect(migrated).toMatchObject({
      version: 3,
      petName: "Bean",
      coins: 182,
      createdAt: previous.createdAt,
      unlockedDecorations: previous.unlockedDecorations,
      selectedDecoration: "rose-cushion",
      highScores: { memory: 240 },
    });
    expect(migrated?.keepsakes).toBeDefined();
    expect(migrated?.keepsakes.stamps.home).toBe(previous.createdAt);
    expect(migrated?.keepsakes.gamesPlayed).toBe(0);
  });

  it("rejects future versions and malformed core identity instead of creating a replacement", () => {
    const save = createPetSave("cat", "Mochi");
    expect(migrateSave({ ...save, version: 4 })).toBeNull();
    expect(migrateSave({ ...save, version: undefined })).toBeNull();
    expect(migrateSave({ ...save, petType: "dragon" })).toBeNull();
    expect(migrateSave({ ...save, petName: "   " })).toBeNull();
    expect(migrateSave({ ...save, createdAt: "invalid" })).toBeNull();
    expect(migrateSave({ ...save, stats: { ...save.stats, energy: Number.NaN } })).toBeNull();
  });

  it("normalizes invalid counters, bounds stats and only equips owned decorations", () => {
    const save = createPetSave("cat", "Mochi");
    const migrated = migrateSave({
      ...save,
      coins: Infinity,
      stats: { fullness: -50, happiness: 200, energy: 42.6, cleanliness: 80 },
      highScores: { memory: Infinity, "treat-catch": -20, matching: 17.8, constructor: "bad" },
      isSleeping: "false",
      unlockedDecorations: ["heart-lamp", "heart-lamp", null],
      selectedDecoration: "moon-mobile",
    });
    expect(migrated?.stats).toEqual({ fullness: 15, happiness: 100, energy: 42.6, cleanliness: 80 });
    expect(migrated?.coins).toBe(0);
    expect(migrated?.highScores).toEqual({ "treat-catch": 0, matching: 17 });
    expect(migrated?.unlockedDecorations).toEqual(["heart-lamp"]);
    expect(migrated?.selectedDecoration).toBe("heart-lamp");
    expect(migrated?.isSleeping).toBe(false);
  });
});

describe("loading and saving", () => {
  it("never reads or writes a different username's local save", async () => {
    const katie = createPetSave("cat", "Mochi");
    const nova = createPetSave("hamster", "Pip");
    saveLocally("preview-katie", katie);
    saveLocally("preview-nova", nova);
    await expect(loadBestSave(previewUser)).resolves.toEqual({ save: katie, cloudFailed: false });
    await expect(loadBestSave({ ...previewUser, id: "preview-nova", username: "nova" })).resolves.toEqual({ save: nova, cloudFailed: false });
    deleteLocalSave("preview-katie");
    expect(loadLocalSave("preview-nova")).toEqual(nova);
    expect(loadLocalSave("preview-katie")).toBeNull();
    expect(loadCloudSave).not.toHaveBeenCalled();
  });

  it("distinguishes a failed cloud read from a confirmed empty account", async () => {
    vi.mocked(loadCloudSave).mockRejectedValue(new Error("offline"));
    await expect(loadBestSave(cloudUser)).resolves.toEqual({ save: null, cloudFailed: true });
    expect(saveToCloud).not.toHaveBeenCalled();
    vi.mocked(loadCloudSave).mockResolvedValue(null);
    await expect(loadBestSave(cloudUser)).resolves.toEqual({ save: null, cloudFailed: false });
  });

  it("flags a cached save as unconfirmed when cloud loading fails", async () => {
    const save = createPetSave("cat", "Mochi");
    saveLocally("katie", save);
    vi.mocked(loadCloudSave).mockRejectedValue(new Error("offline"));
    await expect(loadBestSave(cloudUser)).resolves.toEqual({ save, cloudFailed: true });
    expect(saveToCloud).not.toHaveBeenCalled();
  });

  it("chooses the newest valid save, preferring the cloud when timestamps tie", async () => {
    const local = { ...createPetSave("cat", "Mochi"), coins: 50, updatedAt: "2026-09-15T12:00:00.000Z" };
    const cloud = { ...local, coins: 70, updatedAt: "2026-09-16T12:00:00.000Z" };
    saveLocally("katie", local);
    vi.mocked(loadCloudSave).mockResolvedValue(cloud);
    expect((await loadBestSave(cloudUser)).save?.coins).toBe(70);
    saveLocally("katie", { ...local, updatedAt: "2026-09-17T12:00:00.000Z" });
    expect((await loadBestSave(cloudUser)).save?.coins).toBe(50);
    saveLocally("katie", { ...local, updatedAt: cloud.updatedAt });
    expect((await loadBestSave(cloudUser)).save?.coins).toBe(70);
  });

  it("leaves malformed and future-version saves untouched, even with a valid fallback", async () => {
    const save = createPetSave("cat", "Mochi");
    saveLocally("katie", save);
    vi.mocked(loadCloudSave).mockResolvedValue({ ...save, version: 99 });
    await expect(loadBestSave(cloudUser)).rejects.toThrow("newer update");
    vi.mocked(loadCloudSave).mockResolvedValue({ invalid: true });
    await expect(loadBestSave(cloudUser)).rejects.toThrow("could not be opened");
    values.set("kpf:save:katie", "{incomplete");
    await expect(loadBestSave(cloudUser)).rejects.toThrow("could not be opened");
    expect(values.get("kpf:save:katie")).toBe("{incomplete");
    expect(saveToCloud).not.toHaveBeenCalled();
  });

  it("can load from the cloud when browser storage is blocked", async () => {
    const save = createPetSave("cat", "Mochi");
    vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error("blocked"); });
    vi.mocked(loadCloudSave).mockResolvedValue(save);
    await expect(loadBestSave(cloudUser)).resolves.toEqual({ save, cloudFailed: false });
    await expect(loadBestSave(previewUser)).rejects.toThrow("could not save");
  });

  it("reports a cloud-only success when the local cache is full", async () => {
    const save = createPetSave("cat", "Mochi");
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error("quota"); });
    await expect(syncSave(cloudUser, save)).resolves.toEqual({ localSaved: false, cloudSaved: true });
    expect(saveToCloud).toHaveBeenCalledWith("katie", save);
    await expect(syncSave(previewUser, save)).rejects.toThrow("could not save");
  });

  it("keeps a local backup but reports a failed cloud write", async () => {
    const save = createPetSave("cat", "Mochi");
    vi.mocked(saveToCloud).mockRejectedValue(new Error("offline"));
    await expect(syncSave(cloudUser, save)).rejects.toThrow("offline");
    expect(loadLocalSave("katie")).toEqual(save);
  });
});
