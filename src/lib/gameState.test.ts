import { describe, expect, it } from "vitest";
import {
  applyTimeDecay,
  buyShopItem,
  careForPet,
  createPetSave,
  deriveMood,
  feedPet,
  formatPetAge,
  getFeedAvailability,
  getMemoryReward,
  getRoomPhase,
  getTreatCatchReward,
} from "./gameState";
import { PETS } from "../data/pets";
import { SHOP_ITEMS } from "../data/shop";
import { migrateSave } from "./storage";

describe("game state", () => {
  it("creates a safe starter pet", () => {
    const save = createPetSave("cat", "Mochi");
    expect(save.petName).toBe("Mochi");
    expect(save.coins).toBe(25);
    expect(save.stats.fullness).toBeGreaterThan(50);
  });

  it("never decays below the gentle floor", () => {
    const save = createPetSave("hamster", "Pip");
    save.lastSeenAt = new Date(Date.now() - 1000 * 60 * 60 * 500).toISOString();
    const decayed = applyTimeDecay(save);
    expect(Math.min(...Object.values(decayed.stats))).toBeGreaterThanOrEqual(15);
  });

  it("uses mood priorities", () => {
    const save = createPetSave("panda", "Bean");
    save.stats.fullness = 20;
    save.stats.energy = 15;
    expect(deriveMood(save)).toBe("hungry");
  });

  it("charges coins and improves fullness when feeding", () => {
    const save = createPetSave("cat", "Mochi");
    save.stats.fullness = 60;
    const fed = feedPet(save, PETS.cat.foods[0]);
    expect(fed.coins).toBe(save.coins - PETS.cat.foods[0].cost);
    expect(fed.stats.fullness).toBeGreaterThan(save.stats.fullness);
  });

  it("does not spend coins when a snack would overflow fullness", () => {
    const save = createPetSave("cat", "Mochi");
    save.stats.fullness = 95;
    const item = PETS.cat.foods[2];
    expect(getFeedAvailability(save, item).reason).toBe("too-full");
    expect(feedPet(save, item)).toBe(save);
    expect(save.coins).toBe(25);
  });

  it("gives no Treat Catch coins for a zero score", () => {
    expect(getTreatCatchReward(0)).toBe(0);
    expect(getTreatCatchReward(10)).toBe(6);
    expect(getTreatCatchReward(60)).toBe(8);
  });

  it("calculates the Memory Pairs reward consistently", () => {
    expect(getMemoryReward(6)).toBe(16);
    expect(getMemoryReward(30)).toBe(10);
  });

  it("lets a pet nap without introducing punishment", () => {
    const save = createPetSave("cat", "Mochi");
    const sleeping = careForPet(save, "nap");
    expect(sleeping.isSleeping).toBe(true);
    expect(deriveMood(sleeping)).toBe("sleeping");
  });

  it("buys a shop item once and places it in the room", () => {
    const save = createPetSave("hamster", "Pip");
    const cushion = SHOP_ITEMS.find((item) => item.id === "rose-cushion")!;
    const bought = buyShopItem(save, cushion);
    const selectedAgain = buyShopItem(bought, cushion);
    expect(bought.coins).toBe(save.coins - cushion.cost);
    expect(bought.unlockedDecorations).toContain(cushion.id);
    expect(bought.selectedDecoration).toBe(cushion.id);
    expect(selectedAgain.coins).toBe(bought.coins);
  });

  it("changes the room with local day and night time", () => {
    expect(getRoomPhase(new Date(2026, 8, 2, 12))).toBe("day");
    expect(getRoomPhase(new Date(2026, 8, 2, 23))).toBe("night");
  });

  it("shows a friendly age derived from the adoption date", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    expect(formatPetAge("2026-09-20T11:00:00.000Z", now)).toBe("Less than a day old");
    expect(formatPetAge("2026-09-17T12:00:00.000Z", now)).toBe("3 days old");
    expect(formatPetAge("2026-08-30T12:00:00.000Z", now)).toBe("3 weeks old");
  });

  it("migrates an existing version 1 save without losing progress", () => {
    const current = createPetSave("panda", "Bean");
    const legacy = { ...current, version: 1, lastInteraction: undefined };
    const migrated = migrateSave(legacy);
    expect(migrated?.version).toBe(2);
    expect(migrated?.petName).toBe("Bean");
    expect(migrated?.coins).toBe(25);
    expect(migrated?.createdAt).toBe(current.createdAt);
  });
});
