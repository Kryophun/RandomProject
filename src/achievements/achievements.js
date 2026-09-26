const ACHIEVEMENT_STORAGE_KEY = "garden-snake-achievements";

export const ACHIEVEMENTS = Object.freeze([
  Object.freeze({
    id: "first-bite",
    icon: "🍎",
    title: "First Bite",
    description: "Eat your first apple.",
    isUnlocked: (state) => (state.totalApplesEaten ?? 0) >= 1,
  }),
  Object.freeze({
    id: "apple-collector",
    icon: "🧺",
    title: "Apple Collector",
    description: "Eat 10 apples in a single run.",
    isUnlocked: (state) => (state.totalApplesEaten ?? 0) >= 10,
  }),
  Object.freeze({
    id: "long-snake",
    icon: "🐍",
    title: "Long Snake",
    description: "Grow to 15 segments.",
    isUnlocked: (state) => state.snake.length >= 15,
  }),
  Object.freeze({
    id: "rainbow-powered",
    icon: "🌈",
    title: "Taste the Rainbow",
    description: "Eat a rainbow apple in Campaign mode.",
    isUnlocked: (state) => (state.rainbowApplesEaten ?? 0) >= 1,
  }),
  Object.freeze({
    id: "enemy-hunter",
    icon: "⚔️",
    title: "Enemy Hunter",
    description: "Defeat five enemies in one Campaign run.",
    isUnlocked: (state) => (state.enemiesDefeated ?? 0) >= 5,
  }),
  Object.freeze({
    id: "campaign-level-3",
    icon: "🗺️",
    title: "Pathfinder",
    description: "Reach Level 3 in Campaign mode.",
    isUnlocked: (state) =>
      state.gameMode === "campaign" && state.level >= 3,
  }),
  Object.freeze({
    id: "campaign-level-5",
    icon: "🏆",
    title: "Campaign Champion",
    description: "Reach Level 5 in Campaign mode.",
    isUnlocked: (state) =>
      state.gameMode === "campaign" && state.level >= 5,
  }),
]);

const achievementIds = new Set(
  ACHIEVEMENTS.map((achievement) => achievement.id),
);

export function readUnlockedAchievements(
  storage = globalThis.localStorage,
) {
  try {
    const value = JSON.parse(
      storage?.getItem(ACHIEVEMENT_STORAGE_KEY) ?? "[]",
    );

    return Array.isArray(value)
      ? value.filter((id) => achievementIds.has(id))
      : [];
  } catch {
    return [];
  }
}

export function writeUnlockedAchievements(
  unlockedIds,
  storage = globalThis.localStorage,
) {
  try {
    storage?.setItem(
      ACHIEVEMENT_STORAGE_KEY,
      JSON.stringify([...new Set(unlockedIds)]),
    );
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function evaluateAchievements(state, unlockedIds = []) {
  const unlocked = new Set(unlockedIds);
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (achievement) =>
      !unlocked.has(achievement.id) && achievement.isUnlocked(state),
  );

  for (const achievement of newlyUnlocked) {
    unlocked.add(achievement.id);
  }

  return {
    unlockedIds: [...unlocked],
    newlyUnlocked,
  };
}

export { ACHIEVEMENT_STORAGE_KEY };
