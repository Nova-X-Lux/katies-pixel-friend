import { describe, expect, it } from "vitest";
import { getSnackPosition, getSnackStackReward, getSnackStackScore, landSnack } from "./snackStack";

describe("Snack Stack landings", () => {
  it("trims unsupported edges on either side of the stack", () => {
    expect(landSnack({ x: 20, width: 60 }, 35)).toEqual({ landed: true, perfect: false, layer: { x: 35, width: 45 } });
    expect(landSnack({ x: 20, width: 60 }, 5)).toEqual({ landed: true, perfect: false, layer: { x: 20, width: 45 } });
  });

  it("snaps close landings without shrinking, but tightens tolerance for narrow layers", () => {
    expect(landSnack({ x: 20, width: 60 }, 22)).toEqual({ landed: true, perfect: true, layer: { x: 20, width: 60 } });
    expect(landSnack({ x: 20, width: 10 }, 21.1).perfect).toBe(false);
  });

  it("ends a round on a miss, a touching edge, or an invisible sliver", () => {
    for (const x of [81, 80, 78]) expect(landSnack({ x: 20, width: 60 }, x).landed).toBe(false);
    expect(landSnack({ x: 20, width: 60 }, 77).landed).toBe(true);
    expect(landSnack({ x: 20, width: 60 }, Number.NaN).landed).toBe(false);
  });

  it("always keeps a successful layer inside its supporting layer", () => {
    for (let movingX = 0; movingX <= 100; movingX += 0.5) {
      const landing = landSnack({ x: 24, width: 40 }, movingX);
      if (landing.landed) {
        expect(landing.layer.x).toBeGreaterThanOrEqual(24);
        expect(landing.layer.x + landing.layer.width).toBeLessThanOrEqual(64);
        expect(landing.layer.width).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("Snack Stack motion and rewards", () => {
  it("bounces at field edges and starts consecutive layers from opposite sides", () => {
    expect(getSnackPosition(0, 64, 0)).toBe(0);
    expect(getSnackPosition(1500, 64, 0)).toBe(36);
    expect(getSnackPosition(3000, 64, 0)).toBe(0);
    expect(getSnackPosition(0, 64, 1)).toBe(36);
    expect(getSnackPosition(1500, 100, 0)).toBe(0);
    for (let time = 0; time < 30000; time += 137) {
      expect(getSnackPosition(time, 7, 10)).toBeGreaterThanOrEqual(0);
      expect(getSnackPosition(time, 7, 10)).toBeLessThanOrEqual(93);
    }
  });

  it("gives nothing for a first-drop miss and rewards progress with a capped completion bonus", () => {
    expect(getSnackStackReward(0, 0)).toBe(0);
    expect(getSnackStackReward(1, 0)).toBe(1);
    expect(getSnackStackReward(6, 3)).toBe(7);
    expect(getSnackStackReward(12, 0)).toBe(14);
    expect(getSnackStackReward(12, 12)).toBe(18);
    expect(getSnackStackReward(999, 999)).toBe(18);
    expect(getSnackStackReward(-1, 99)).toBe(0);
    expect(getSnackStackReward(Number.NaN, 99)).toBe(0);
  });

  it("awards points only for landed layers and valid perfects", () => {
    expect(getSnackStackScore(0, 12)).toBe(0);
    expect(getSnackStackScore(6, 3)).toBe(75);
    expect(getSnackStackScore(12, 0)).toBe(150);
    expect(getSnackStackScore(12, 12)).toBe(210);
    expect(getSnackStackScore(12, 200)).toBe(210);
  });
});
