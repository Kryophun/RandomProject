const HIGH_SCORE_KEY = "garden-snake-high-score";

export function readHighScore(storage = globalThis.localStorage) {
  try {
    const storedValue = storage?.getItem(HIGH_SCORE_KEY);
    const score = Number(storedValue);

    return Number.isInteger(score) && score >= 0 ? score : 0;
  } catch {
    return 0;
  }
}

export function writeHighScore(score, storage = globalThis.localStorage) {
  if (!Number.isInteger(score) || score < 0) {
    return false;
  }

  try {
    storage?.setItem(HIGH_SCORE_KEY, String(score));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export { HIGH_SCORE_KEY };
