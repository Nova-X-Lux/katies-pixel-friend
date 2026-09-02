import { describe, expect, it } from "vitest";
import { applyTimeDecay, careForPet, createPetSave, deriveMood, feedPet } from "./gameState";
import { PETS } from "../data/pets";

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
    const fed = feedPet(save, PETS.cat.foods[0]);
    expect(fed.coins).toBe(save.coins - PETS.cat.foods[0].cost);
    expect(fed.stats.fullness).toBeGreaterThan(save.stats.fullness);
  });

  it("lets a pet nap without introducing punishment", () => {
    const save = createPetSave("cat", "Mochi");
    const sleeping = careForPet(save, "nap");
    expect(sleeping.isSleeping).toBe(true);
    expect(deriveMood(sleeping)).toBe("sleeping");
  });
});
