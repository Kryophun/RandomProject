import { describe, expect, it, vi } from "vitest";
import {
  ACHIEVEMENT_STORAGE_KEY,
  evaluateAchievements,
  readUnlockedAchievements,
  writeUnlockedAchievements,
} from "../src/achievements/achievements.js";

function createState(overrides = {}) {
  return {
    snake: [{ x: 0, y: 0 }],
    totalApplesEaten: 0,
    rainbowApplesEaten: 0,
    enemiesDefeated: 0,
    gameMode: "classic",
    level: 1,
    ...overrides,
  };
}

describe("achievement evaluation", () => {
  it("unlocks matching milestones without duplicating existing unlocks", () => {
    const result = evaluateAchievements(
      createState({
        snake: Array.from({ length: 15 }, (_, x) => ({ x, y: 0 })),
        totalApplesEaten: 10,
      }),
      ["first-bite"],
    );

    expect(result.newlyUnlocked.map(({ id }) => id)).toEqual([
      "apple-collector",
      "long-snake",
    ]);
    expect(result.unlockedIds).toEqual([
      "first-bite",
      "apple-collector",
      "long-snake",
    ]);
  });

  it("unlocks the requested campaign level milestone", () => {
    const result = evaluateAchievements(
      createState({ gameMode: "campaign", level: 5 }),
    );

    expect(result.unlockedIds).toContain("campaign-level-3");
    expect(result.unlockedIds).toContain("campaign-level-5");
  });
});

describe("achievement storage", () => {
  it("reads only recognized achievement identifiers", () => {
    const storage = {
      getItem: vi.fn(() =>
        JSON.stringify(["first-bite", "not-an-achievement"]),
      ),
    };

    expect(readUnlockedAchievements(storage)).toEqual(["first-bite"]);
    expect(storage.getItem).toHaveBeenCalledWith(ACHIEVEMENT_STORAGE_KEY);
  });

  it("writes unique identifiers and tolerates storage failures", () => {
    const storage = {
      setItem: vi.fn(),
    };

    expect(
      writeUnlockedAchievements(
        ["first-bite", "first-bite", "campaign-level-5"],
        storage,
      ),
    ).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      ACHIEVEMENT_STORAGE_KEY,
      JSON.stringify(["first-bite", "campaign-level-5"]),
    );

    expect(
      writeUnlockedAchievements(["first-bite"], {
        setItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe(false);
  });
});
