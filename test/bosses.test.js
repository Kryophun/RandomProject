import { describe, expect, it } from "vitest";
import {
  advanceBoss,
  bossOccupiesPosition,
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
    expect(createCampaignBoss(20, 5, snake, []).hitRadius).toBe(1);
  });

  it("uses a multi-cell hit area", () => {
    const boss = createCampaignBoss(20, 5, snake, []);

    expect(
      bossOccupiesPosition(boss, { x: boss.x + 1, y: boss.y + 1 }),
    ).toBe(true);
    expect(
      bossOccupiesPosition(boss, { x: boss.x + 2, y: boss.y }),
    ).toBe(false);
  });

  it("moves the hunter toward the snake", () => {
    const waiting = advanceBoss(
      {
        x: 2,
        y: 2,
        type: "hunter",
        level: 5,
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 7, y: 2 }],
        tick: 4,
      },
    );
    const result = advanceBoss(
      {
        x: 2,
        y: 2,
        type: "hunter",
        level: 5,
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 7, y: 2 }],
        tick: 6,
      },
    );

    expect(waiting.boss).toMatchObject({ x: 2, y: 2 });
    expect(result.boss).toMatchObject({ x: 3, y: 2 });
    expect(result.projectile).toBeNull();
  });

  it("makes the turret fire toward the snake", () => {
    const result = advanceBoss(
      {
        x: 2,
        y: 2,
        type: "turret",
        level: 10,
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 2, y: 8 }],
        tick: 9,
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
        level: 15,
        direction: { x: 1, y: 0 },
      },
      {
        gridSize: 10,
        snake: [{ x: 8, y: 2 }],
        tick: 12,
      },
    );

    expect(result.boss).toMatchObject({ x: 4, y: 2 });
    expect(result.projectile).toBeNull();
  });

  it("periodically spawns a capped patrol minion", () => {
    const boss = {
      x: 5,
      y: 5,
      type: "hunter",
      level: 5,
      direction: { x: 1, y: 0 },
    };
    const spawned = advanceBoss(boss, {
      gridSize: 12,
      snake: [{ x: 1, y: 1 }],
      tick: 18,
    });

    expect(spawned.spawnedEnemy).toMatchObject({
      pattern: "horizontal",
    });

    const capped = advanceBoss(boss, {
      gridSize: 12,
      snake: [{ x: 1, y: 1 }],
      enemies: [spawned.spawnedEnemy],
      tick: 36,
    });

    expect(capped.spawnedEnemy).toBeNull();
  });

  it("applies the purchased boss slowdown multiplier", () => {
    const boss = {
      x: 2,
      y: 2,
      type: "hunter",
      level: 5,
      direction: { x: 1, y: 0 },
    };
    const waiting = advanceBoss(boss, {
      gridSize: 10,
      snake: [{ x: 8, y: 2 }],
      tick: 6,
      speedMultiplier: 1.5,
    });
    const moved = advanceBoss(boss, {
      gridSize: 10,
      snake: [{ x: 8, y: 2 }],
      tick: 9,
      speedMultiplier: 1.5,
    });

    expect(waiting.boss).toMatchObject({ x: 2, y: 2 });
    expect(moved.boss).toMatchObject({ x: 3, y: 2 });
  });
});
