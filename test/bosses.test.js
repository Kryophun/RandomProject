import { describe, expect, it } from "vitest";
import {
  advanceBoss,
  createCampaignBoss,
  isBossLevel,
} from "../src/game/bosses.js";

const snake = [
  { x: 11, y: 10 },
  { x: 10, y: 10 },
  { x: 9, y: 10 },
];

describe("campaign bosses", () => {
  it("marks every fifth level as a boss level", () => {
    expect(isBossLevel(4)).toBe(false);
    expect(isBossLevel(5)).toBe(true);
    expect(isBossLevel(10)).toBe(true);
    expect(isBossLevel(15)).toBe(true);
  });

  it("cycles through different boss attack types", () => {
    expect(createCampaignBoss(20, 5, snake, []).type).toBe("hunter");
    expect(createCampaignBoss(20, 10, snake, []).type).toBe("turret");
    expect(createCampaignBoss(20, 15, snake, []).type).toBe("charger");
    expect(createCampaignBoss(20, 20, snake, []).type).toBe("hunter");
  });

  it("moves the hunter toward the snake", () => {
    const result = advanceBoss(
      {
        x: 2,
        y: 2,
        type: "hunter",
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 7, y: 2 }],
        tick: 2,
      },
    );

    expect(result.boss).toMatchObject({ x: 3, y: 2 });
    expect(result.projectile).toBeNull();
  });

  it("makes the turret fire toward the snake", () => {
    const result = advanceBoss(
      {
        x: 2,
        y: 2,
        type: "turret",
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 2, y: 8 }],
        tick: 3,
      },
    );

    expect(result.boss).toMatchObject({ x: 2, y: 2 });
    expect(result.projectile).toMatchObject({
      x: 2,
      y: 2,
      direction: { x: 0, y: 1 },
    });
  });

  it("makes the charger move two cells at once", () => {
    const result = advanceBoss(
      {
        x: 2,
        y: 2,
        type: "charger",
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 8, y: 2 }],
        tick: 4,
      },
    );

    expect(result.boss).toMatchObject({ x: 4, y: 2 });
    expect(result.projectile).toBeNull();
  });
});
