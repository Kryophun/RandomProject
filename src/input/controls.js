const DIRECTION_KEYS = Object.freeze({
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
});

export function directionForKey(key) {
  return DIRECTION_KEYS[key] ?? null;
}
