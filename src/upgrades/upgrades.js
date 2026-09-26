const UPGRADE_STORAGE_KEY = "garden-snake-upgrades";

export const UPGRADES = Object.freeze([
  Object.freeze({
    id: "calm-roots",
    icon: "🌱",
    title: "Calm Roots",
    description: "All movement intervals are 12% slower.",
    cost: 10,
    depth: 0,
    prerequisites: [],
    effects: Object.freeze({ tickIntervalMultiplier: 0.12 }),
  }),
  Object.freeze({
    id: "orchard-wisdom",
    icon: "🍏",
    title: "Orchard Wisdom",
    description: "Regular apples grant one additional score point.",
    cost: 25,
    depth: 1,
    prerequisites: ["calm-roots"],
    effects: Object.freeze({ appleScoreBonus: 1 }),
  }),
  Object.freeze({
    id: "boss-training",
    icon: "🎯",
    title: "Boss Training",
    description: "Start every boss level with one loaded apple shot.",
    cost: 30,
    depth: 1,
    prerequisites: ["calm-roots"],
    effects: Object.freeze({ startingBossAmmo: 1 }),
  }),
  Object.freeze({
    id: "rainbow-reservoir",
    icon: "🌈",
    title: "Rainbow Reservoir",
    description: "Rainbow invincibility lasts 20 additional moves.",
    cost: 70,
    depth: 2,
    prerequisites: ["orchard-wisdom"],
    effects: Object.freeze({ invincibilityBonus: 20 }),
  }),
  Object.freeze({
    id: "hunter-bounty",
    icon: "⚔️",
    title: "Hunter's Bounty",
    description: "Defeated enemies grant one additional score point.",
    cost: 85,
    depth: 2,
    prerequisites: ["orchard-wisdom"],
    effects: Object.freeze({ enemyScoreBonus: 1 }),
  }),
  Object.freeze({
    id: "heavy-spit",
    icon: "💥",
    title: "Heavy Spit",
    description: "Each apple shot removes two boss health instead of one.",
    cost: 90,
    depth: 2,
    prerequisites: ["boss-training"],
    effects: Object.freeze({ bossDamageBonus: 1 }),
  }),
  Object.freeze({
    id: "deep-pockets",
    icon: "🎒",
    title: "Deep Pockets",
    description: "Each boss-level apple loads two shots instead of one.",
    cost: 110,
    depth: 2,
    prerequisites: ["boss-training"],
    effects: Object.freeze({ bossAmmoBonus: 1 }),
  }),
  Object.freeze({
    id: "prismatic-heart",
    icon: "💎",
    title: "Prismatic Heart",
    description: "Rainbow invincibility lasts 30 additional moves.",
    cost: 180,
    depth: 3,
    prerequisites: ["rainbow-reservoir"],
    effects: Object.freeze({ invincibilityBonus: 30 }),
  }),
  Object.freeze({
    id: "rainbow-windfall",
    icon: "✨",
    title: "Rainbow Windfall",
    description: "Rainbow apples grant five additional score points.",
    cost: 200,
    depth: 3,
    prerequisites: ["rainbow-reservoir"],
    effects: Object.freeze({ rainbowScoreBonus: 5 }),
  }),
  Object.freeze({
    id: "royal-bounty",
    icon: "👑",
    title: "Royal Bounty",
    description: "Defeated enemies grant two additional score points.",
    cost: 210,
    depth: 3,
    prerequisites: ["hunter-bounty"],
    effects: Object.freeze({ enemyScoreBonus: 2 }),
  }),
  Object.freeze({
    id: "tangled-time",
    icon: "🕸️",
    title: "Tangled Time",
    description: "Enemies wait one additional tick between moves.",
    cost: 230,
    depth: 3,
    prerequisites: ["hunter-bounty"],
    effects: Object.freeze({ enemyMoveIntervalBonus: 1 }),
  }),
  Object.freeze({
    id: "siege-apples",
    icon: "☄️",
    title: "Siege Apples",
    description: "Apple shots gain one more boss damage.",
    cost: 240,
    depth: 3,
    prerequisites: ["heavy-spit"],
    effects: Object.freeze({ bossDamageBonus: 1 }),
  }),
  Object.freeze({
    id: "boss-hourglass",
    icon: "⏳",
    title: "Boss Hourglass",
    description: "Boss attacks and minion summons are 50% slower.",
    cost: 260,
    depth: 3,
    prerequisites: ["heavy-spit"],
    effects: Object.freeze({ bossIntervalMultiplier: 0.5 }),
  }),
  Object.freeze({
    id: "loaded-vault",
    icon: "🧰",
    title: "Loaded Vault",
    description: "Start boss levels with two additional apple shots.",
    cost: 250,
    depth: 3,
    prerequisites: ["deep-pockets"],
    effects: Object.freeze({ startingBossAmmo: 2 }),
  }),
  Object.freeze({
    id: "endless-quiver",
    icon: "🏹",
    title: "Endless Quiver",
    description: "Boss-level apples load two additional shots.",
    cost: 280,
    depth: 3,
    prerequisites: ["deep-pockets"],
    effects: Object.freeze({ bossAmmoBonus: 2 }),
  }),
  Object.freeze({
    id: "eternal-rainbow",
    icon: "🔮",
    title: "Eternal Rainbow",
    description:
      "Rainbow power lasts 50 additional moves and grants five more score.",
    cost: 350,
    depth: 4,
    prerequisites: ["prismatic-heart", "rainbow-windfall"],
    effects: Object.freeze({
      invincibilityBonus: 50,
      rainbowScoreBonus: 5,
    }),
  }),
  Object.freeze({
    id: "enemy-stasis",
    icon: "❄️",
    title: "Enemy Stasis",
    description:
      "Enemies wait two additional ticks and grant two more score.",
    cost: 380,
    depth: 4,
    prerequisites: ["royal-bounty", "tangled-time"],
    effects: Object.freeze({
      enemyMoveIntervalBonus: 2,
      enemyScoreBonus: 2,
    }),
  }),
  Object.freeze({
    id: "boss-dominator",
    icon: "🛡️",
    title: "Boss Dominator",
    description:
      "Apple shots gain two boss damage and bosses act 50% slower.",
    cost: 420,
    depth: 4,
    prerequisites: ["siege-apples", "boss-hourglass"],
    effects: Object.freeze({
      bossDamageBonus: 2,
      bossIntervalMultiplier: 0.5,
    }),
  }),
  Object.freeze({
    id: "arsenal-overflow",
    icon: "📦",
    title: "Arsenal Overflow",
    description:
      "Start with three more boss shots and gain two more per apple.",
    cost: 400,
    depth: 4,
    prerequisites: ["loaded-vault", "endless-quiver"],
    effects: Object.freeze({
      startingBossAmmo: 3,
      bossAmmoBonus: 2,
    }),
  }),
  Object.freeze({
    id: "garden-ascendant",
    icon: "🌟",
    title: "Garden Ascendant",
    description:
      "Movement is 15% slower and regular apples grant three more score.",
    cost: 800,
    depth: 5,
    prerequisites: [
      "eternal-rainbow",
      "enemy-stasis",
      "boss-dominator",
      "arsenal-overflow",
    ],
    effects: Object.freeze({
      tickIntervalMultiplier: 0.15,
      appleScoreBonus: 3,
    }),
  }),
]);

const upgradeIds = new Set(UPGRADES.map((upgrade) => upgrade.id));

export function calculateRunUpgradePoints(state) {
  if (state.debugMode) {
    return 0;
  }

  const basePoints =
    (state.totalApplesEaten ?? 0) +
    (state.enemiesDefeated ?? 0) * 3 +
    (state.bossesDefeated ?? 0) * 10 +
    (state.rainbowApplesEaten ?? 0) * 2;
  const levelModifier = 1 + (state.levelsCompleted ?? 0) / 10;
  const milestoneModifier =
    1 + Math.floor((state.levelsCompleted ?? 0) / 5) / 10;
  const finalBossModifier =
    (state.levelsCompleted ?? 0) >= 50 ? 3 : 1;

  return Math.floor(
    basePoints *
      levelModifier *
      milestoneModifier *
      finalBossModifier +
      Number.EPSILON,
  );
}

export function readUpgradeProgress(storage = globalThis.localStorage) {
  try {
    const stored = JSON.parse(
      storage?.getItem(UPGRADE_STORAGE_KEY) ?? "{}",
    );
    const points =
      Number.isInteger(stored.points) && stored.points >= 0
        ? stored.points
        : 0;
    const purchased = Array.isArray(stored.purchased)
      ? stored.purchased.filter((id) => upgradeIds.has(id))
      : [];

    return {
      points,
      purchased: [...new Set(purchased)],
    };
  } catch {
    return { points: 0, purchased: [] };
  }
}

export function writeUpgradeProgress(
  progress,
  storage = globalThis.localStorage,
) {
  try {
    storage?.setItem(
      UPGRADE_STORAGE_KEY,
      JSON.stringify({
        points: progress.points,
        purchased: [...new Set(progress.purchased)],
      }),
    );
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function getUpgradeEffects(purchasedIds = []) {
  const purchased = new Set(purchasedIds);

  return UPGRADES.reduce(
    (effects, upgrade) => {
      if (!purchased.has(upgrade.id)) {
        return effects;
      }

      for (const [name, value] of Object.entries(upgrade.effects)) {
        effects[name] = (effects[name] ?? 0) + value;
      }

      return effects;
    },
    {
      tickIntervalMultiplier: 1,
      appleScoreBonus: 0,
      startingBossAmmo: 0,
      invincibilityBonus: 0,
      enemyScoreBonus: 0,
      bossDamageBonus: 0,
      bossAmmoBonus: 0,
      rainbowScoreBonus: 0,
      enemyMoveIntervalBonus: 0,
      bossIntervalMultiplier: 1,
    },
  );
}

export function isUpgradeAvailable(upgrade, purchasedIds = []) {
  const purchased = new Set(purchasedIds);

  return (
    !purchased.has(upgrade.id) &&
    upgrade.prerequisites.every((id) => purchased.has(id))
  );
}

export function purchaseUpgrade(progress, upgradeId) {
  const upgrade = UPGRADES.find((candidate) => candidate.id === upgradeId);

  if (
    !upgrade ||
    !isUpgradeAvailable(upgrade, progress.purchased) ||
    progress.points < upgrade.cost
  ) {
    return { progress, purchased: false };
  }

  return {
    progress: {
      points: progress.points - upgrade.cost,
      purchased: [...progress.purchased, upgrade.id],
    },
    purchased: true,
  };
}

export { UPGRADE_STORAGE_KEY };
