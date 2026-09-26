import { describe, expect, it } from "vitest";
import {
  createCampaignEnemies,
  getEnemyMoveInterval,
  moveEnemies,
} from "../src/game/enemies.js";

describe("campaign enemies", () => {
  it("adds more frequent movement on later levels", () => {
    expect(getEnemyMoveInterval(1)).toBe(3);
    expect(getEnemyMoveInterval(5)).toBe(2);
    expect(getEnemyMoveInterval(9)).toBe(1);
  });

  it("creates repeatable enemies with different movement patterns", () => {
    const snake = [
      { x: 11, y: 10 },
      { x: 10, y: 10 },
      { x: 9, y: 10 },
    ];
    const first = createCampaignEnemies(20, 5, 3, snake, []);
    const second = createCampaignEnemies(20, 5, 3, snake, []);

    expect(first).toEqual(second);
    expect(first.map(({ pattern }) => pattern)).toEqual([
      "horizontal",
      "vertical",
      "clockwise",
    ]);
  });

  it("bounces patrol enemies away from obstacles", () => {
    const [moved] = moveEnemies(
      [
        {
          id: "enemy",
          x: 3,
          y: 2,
          pattern: "horizontal",
          direction: { x: 1, y: 0 },
          directionIndex: 0,
        },
      ],
      {
        gridSize: 6,
        walls: [{ x: 4, y: 2 }],
      },
    );

    expect(moved).toMatchObject({
      x: 2,
      y: 2,
      direction: { x: -1, y: 0 },
    });
  });

  it("turns clockwise enemies when their path is blocked", () => {
    const [moved] = moveEnemies(
      [
        {
          id: "enemy",
          x: 3,
          y: 2,
          pattern: "clockwise",
          direction: { x: 1, y: 0 },
          directionIndex: 0,
        },
      ],
      {
        gridSize: 6,
        walls: [{ x: 4, y: 2 }],
      },
    );

    expect(moved).toMatchObject({
      x: 3,
      y: 3,
      direction: { x: 0, y: 1 },
      directionIndex: 1,
    });
  });
});
