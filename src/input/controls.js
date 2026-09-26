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

export function directionForSwipe(
  start,
  end,
  minimumDistance = 24,
) {
  const horizontalDistance = end.x - start.x;
  const verticalDistance = end.y - start.y;
  const absoluteHorizontal = Math.abs(horizontalDistance);
  const absoluteVertical = Math.abs(verticalDistance);

  if (
    Math.max(absoluteHorizontal, absoluteVertical) < minimumDistance ||
    absoluteHorizontal === absoluteVertical
  ) {
    return null;
  }

  if (absoluteHorizontal > absoluteVertical) {
    return horizontalDistance > 0 ? "right" : "left";
  }

  return verticalDistance > 0 ? "down" : "up";
}
