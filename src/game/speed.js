const SPEED_TIERS = Object.freeze([
  Object.freeze({ minimumScore: 0, interval: 140 }),
  Object.freeze({ minimumScore: 5, interval: 120 }),
  Object.freeze({ minimumScore: 10, interval: 100 }),
  Object.freeze({ minimumScore: 18, interval: 85 }),
  Object.freeze({ minimumScore: 28, interval: 70 }),
]);

export function getSpeedTier(score) {
  return SPEED_TIERS.findLastIndex((tier) => score >= tier.minimumScore);
}

export function getTickInterval(score) {
  return SPEED_TIERS[getSpeedTier(score)].interval;
}

export { SPEED_TIERS };
