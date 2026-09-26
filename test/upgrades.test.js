import { describe, expect, it, vi } from "vitest";
import {
  UPGRADE_STORAGE_KEY,
  UPGRADES,
  calculateRunUpgradePoints,
  getUpgradeEffects,
  isUpgradeAvailable,
  purchaseUpgrade,
  readUpgradeProgress,
  writeUpgradeProgress,
} from "../src/upgrades/upgrades.js";

describe("run upgrade points", () => {
  it("adds action values and applies the level modifier", () => {
    expect(
      calculateRunUpgradePoints({
        totalApplesEaten: 5,
        enemiesDefeated: 2,
        bossesDefeated: 1,
        rainbowApplesEaten: 1,
        levelsCompleted: 10,
      }),
    ).toBe(55);
    expect(
      calculateRunUpgradePoints({
        totalApplesEaten: 10,
        levelsCompleted: 1,
      }),
    ).toBe(11);
    expect(
      calculateRunUpgradePoints({
        totalApplesEaten: 10,
        levelsCompleted: 5,
      }),
    ).toBe(16);
  });

  it("does not reward debug runs", () => {
    expect(
      calculateRunUpgradePoints({
        totalApplesEaten: 100,
        enemiesDefeated: 20,
        level: 50,
        debugMode: true,
      }),
    ).toBe(0);
  });
});

describe("upgrade tree", () => {
  it("unlocks two branches after purchasing the root", () => {
    const root = UPGRADES.find(({ id }) => id === "calm-roots");
    const orchard = UPGRADES.find(({ id }) => id === "orchard-wisdom");
    const boss = UPGRADES.find(({ id }) => id === "boss-training");
    const initial = { points: 50, purchased: [] };

    expect(isUpgradeAvailable(root, initial.purchased)).toBe(true);
    expect(isUpgradeAvailable(orchard, initial.purchased)).toBe(false);

    const result = purchaseUpgrade(initial, root.id);

    expect(result.purchased).toBe(true);
    expect(result.progress).toEqual({
      points: 40,
      purchased: ["calm-roots"],
    });
    expect(isUpgradeAvailable(orchard, result.progress.purchased)).toBe(true);
    expect(isUpgradeAvailable(boss, result.progress.purchased)).toBe(true);
  });

  it("combines purchased gameplay effects", () => {
    expect(
      getUpgradeEffects([
        "calm-roots",
        "orchard-wisdom",
        "rainbow-reservoir",
        "prismatic-heart",
        "rainbow-windfall",
      ]),
    ).toMatchObject({
      tickIntervalMultiplier: 1.12,
      appleScoreBonus: 1,
      invincibilityBonus: 50,
      rainbowScoreBonus: 5,
    });
  });

  it("unlocks two fourth-tier upgrades from a completed branch", () => {
    const purchased = [
      "calm-roots",
      "orchard-wisdom",
      "rainbow-reservoir",
    ];
    const prismaticHeart = UPGRADES.find(
      ({ id }) => id === "prismatic-heart",
    );
    const rainbowWindfall = UPGRADES.find(
      ({ id }) => id === "rainbow-windfall",
    );

    expect(isUpgradeAvailable(prismaticHeart, purchased)).toBe(true);
    expect(isUpgradeAvailable(rainbowWindfall, purchased)).toBe(true);
  });

  it("rejects locked or unaffordable purchases", () => {
    expect(
      purchaseUpgrade(
        { points: 100, purchased: [] },
        "rainbow-reservoir",
      ).purchased,
    ).toBe(false);
    expect(
      purchaseUpgrade(
        { points: 9, purchased: [] },
        "calm-roots",
      ).purchased,
    ).toBe(false);
  });
});

describe("upgrade storage", () => {
  it("reads and writes recognized progress", () => {
    const storage = {
      getItem: vi.fn(() =>
        JSON.stringify({
          points: 42,
          purchased: ["calm-roots", "invalid"],
        }),
      ),
      setItem: vi.fn(),
    };

    expect(readUpgradeProgress(storage)).toEqual({
      points: 42,
      purchased: ["calm-roots"],
    });
    expect(
      writeUpgradeProgress(
        { points: 7, purchased: ["calm-roots"] },
        storage,
      ),
    ).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      UPGRADE_STORAGE_KEY,
      JSON.stringify({
        points: 7,
        purchased: ["calm-roots"],
      }),
    );
  });
});
