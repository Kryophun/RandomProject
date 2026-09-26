import { describe, expect, it } from "vitest";
import {
  SPEED_TIERS,
  getSpeedTier,
  getTickInterval,
} from "../src/game/speed.js";

describe("speed progression", () => {
  it.each([
    [0, 0, 140],
    [5, 1, 120],
    [10, 2, 100],
    [18, 3, 85],
    [28, 4, 70],
    [999, 4, 70],
  ])(
    "maps score %i to tier %i and interval %i",
    (score, expectedTier, expectedInterval) => {
      expect(getSpeedTier(score)).toBe(expectedTier);
      expect(getTickInterval(score)).toBe(expectedInterval);
    },
  );

  it("defines every tier from slowest to fastest", () => {
    expect(SPEED_TIERS.map(({ minimumScore }) => minimumScore)).toEqual([
      0, 5, 10, 18, 28,
    ]);
  });
});
