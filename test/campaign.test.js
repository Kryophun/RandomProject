import { describe, expect, it } from "vitest";
import {
  createCampaignLevel,
  getCampaignRequirements,
} from "../src/game/campaign.js";

const snake = [
  { x: 11, y: 10 },
  { x: 10, y: 10 },
  { x: 9, y: 10 },
];

describe("campaign progression", () => {
  it("requires more apples and adds more walls as levels increase", () => {
    expect(getCampaignRequirements(1)).toEqual({
      applesRequired: 3,
      wallCount: 6,
    });
    expect(getCampaignRequirements(5)).toEqual({
      applesRequired: 11,
      wallCount: 22,
    });
  });

  it("creates repeatable but different layouts for each level", () => {
    const first = createCampaignLevel(20, 1, snake);
    const firstAgain = createCampaignLevel(20, 1, snake);
    const second = createCampaignLevel(20, 2, snake);

    expect(first).toEqual(firstAgain);
    expect(second.walls).not.toEqual(first.walls);
    expect(first.walls).toHaveLength(6);
    expect(second.walls).toHaveLength(10);
  });

  it("keeps walls away from the snake and its starting area", () => {
    const level = createCampaignLevel(20, 8, snake);

    for (const wall of level.walls) {
      expect(snake).not.toContainEqual(wall);
      expect(
        Math.abs(wall.x - snake[0].x) + Math.abs(wall.y - snake[0].y),
      ).toBeGreaterThan(3);
    }
  });
});
