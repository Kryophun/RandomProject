import { describe, expect, it } from "vitest";
import {
  advanceLevelCountdown,
  advanceCampaignLevel,
  beginLevelCountdown,
  DIRECTIONS,
  createGameState,
  pauseGame,
  queueDirection,
  resumeGame,
  spitApple,
  startGame,
  stepGame,
} from "../src/game/engine.js";
import { listEmptyCells, placeFruit } from "../src/game/fruit.js";

describe("game state", () => {
  it("creates a ready game with a three-segment snake and open fruit cell", () => {
    const state = createGameState({ gridSize: 8, random: () => 0 });

    expect(state.lifecycle).toBe("ready");
    expect(state.snake).toHaveLength(3);
    expect(state.fruit).toEqual({ x: 0, y: 0 });
    expect(state.snake).not.toContainEqual(state.fruit);
  });

  it("starts only a ready game", () => {
    const ready = createGameState();
    const running = startGame(ready);

    expect(running.lifecycle).toBe("running");
    expect(startGame(running)).toBe(running);
  });

  it("preserves a supported edge mode and defaults invalid values to walls", () => {
    expect(createGameState({ edgeMode: "wrap" }).edgeMode).toBe("wrap");
    expect(createGameState({ edgeMode: "other" }).edgeMode).toBe("walls");
  });

  it("creates campaign targets and walls without blocking fruit", () => {
    const state = createGameState({
      gameMode: "campaign",
      random: () => 0,
    });

    expect(state.gameMode).toBe("campaign");
    expect(state.level).toBe(1);
    expect(state.applesRequired).toBe(3);
    expect(state.walls).toHaveLength(6);
    expect(state.enemies).toHaveLength(1);
    expect(state.walls).not.toContainEqual(state.fruit);
    expect(state.enemies).not.toContainEqual(state.fruit);
    expect(state.snake).not.toContainEqual(state.fruit);
    expect(state.rainbowApple).not.toBeNull();
    expect(state.rainbowApple).not.toEqual(state.fruit);
  });

  it("creates a boss arena every fifth campaign level", () => {
    const state = createGameState({
      gameMode: "campaign",
      level: 5,
      random: () => 0,
    });

    expect(state.bossLevel).toBe(true);
    expect(state.boss).toMatchObject({
      type: "hunter",
      hp: 3,
      maxHp: 3,
    });
    expect(state.enemies).toHaveLength(0);
    expect(state.rainbowApple).toBeNull();
    expect(state.applesRequired).toBe(0);
  });

  it("counts down three seconds before entering the running state", () => {
    const ready = createGameState();
    const three = beginLevelCountdown(ready);
    const two = advanceLevelCountdown(three);
    const one = advanceLevelCountdown(two);
    const running = advanceLevelCountdown(one);

    expect(three).toMatchObject({
      lifecycle: "countdown",
      countdown: 3,
    });
    expect(two.countdown).toBe(2);
    expect(one.countdown).toBe(1);
    expect(running).toMatchObject({
      lifecycle: "running",
      countdown: 0,
    });
  });
});

describe("direction input", () => {
  it("queues a valid turn and rejects a reversal", () => {
    const running = startGame(createGameState());
    const turned = queueDirection(running, "up");

    expect(turned.queuedDirection).toBe(DIRECTIONS.up);
    expect(queueDirection(running, "left")).toBe(running);
  });

  it("accepts only one turn between movement ticks", () => {
    const running = startGame(createGameState());
    const firstTurn = queueDirection(running, "up");

    expect(queueDirection(firstTurn, "left")).toBe(firstTurn);
  });
});

describe("game updates", () => {
  it("moves forward without growing", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8 })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      fruit: { x: 0, y: 0 },
    };

    const next = stepGame(state);

    expect(next.snake).toEqual([
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
    ]);
    expect(next.score).toBe(0);
  });

  it("grows, scores, and places new fruit after eating", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8 })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      fruit: { x: 5, y: 4 },
    };

    const next = stepGame(state, () => 0);

    expect(next.snake).toHaveLength(4);
    expect(next.snake[0]).toEqual({ x: 5, y: 4 });
    expect(next.score).toBe(1);
    expect(next.totalApplesEaten).toBe(1);
    expect(next.snake).not.toContainEqual(next.fruit);
  });

  it("ends the game when the snake hits a wall", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 4 })),
      snake: [
        { x: 3, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
      ],
      fruit: { x: 0, y: 0 },
    };

    expect(stepGame(state).lifecycle).toBe("game-over");
  });

  it("wraps across each edge in wrap mode", () => {
    const cases = [
      [{ x: 3, y: 1 }, DIRECTIONS.right, { x: 0, y: 1 }],
      [{ x: 0, y: 1 }, DIRECTIONS.left, { x: 3, y: 1 }],
      [{ x: 1, y: 0 }, DIRECTIONS.up, { x: 1, y: 3 }],
      [{ x: 1, y: 3 }, DIRECTIONS.down, { x: 1, y: 0 }],
    ];

    for (const [head, direction, expected] of cases) {
      const state = {
        ...startGame(createGameState({ gridSize: 4, edgeMode: "wrap" })),
        snake: [
          head,
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
        direction,
        queuedDirection: direction,
        fruit: { x: 3, y: 3 },
      };

      expect(stepGame(state).snake[0]).toEqual(expected);
    }
  });

  it("ends the game when the snake hits itself", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 6 })),
      snake: [
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ],
      direction: DIRECTIONS.left,
      queuedDirection: DIRECTIONS.left,
      fruit: { x: 5, y: 5 },
    };

    expect(stepGame(state).lifecycle).toBe("game-over");
  });

  it("ends the game when the snake hits a campaign wall", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8, gameMode: "campaign" })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [{ x: 5, y: 4 }],
      fruit: { x: 0, y: 0 },
    };

    expect(stepGame(state).lifecycle).toBe("game-over");
  });

  it("ends the game when an unpowered snake hits an enemy", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8, gameMode: "campaign" })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      enemies: [
        {
          id: "enemy",
          x: 5,
          y: 4,
          pattern: "horizontal",
          direction: DIRECTIONS.right,
          directionIndex: 0,
        },
      ],
      fruit: { x: 0, y: 0 },
      rainbowApple: { x: 0, y: 1 },
    };

    expect(stepGame(state).lifecycle).toBe("game-over");
  });

  it("lets an invincible snake defeat an enemy for bonus points", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8, gameMode: "campaign" })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      enemies: [
        {
          id: "enemy",
          x: 5,
          y: 4,
          pattern: "horizontal",
          direction: DIRECTIONS.right,
          directionIndex: 0,
        },
      ],
      fruit: { x: 0, y: 0 },
      rainbowApple: { x: 0, y: 1 },
      invincibilityTicks: 2,
      score: 0,
    };

    const next = stepGame(state);

    expect(next.lifecycle).toBe("running");
    expect(next.enemies).toHaveLength(0);
    expect(next.enemiesDefeated).toBe(1);
    expect(next.score).toBe(2);
    expect(next.invincibilityTicks).toBe(1);
  });

  it("ends the game when a moving enemy reaches the snake", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8, gameMode: "campaign" })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      enemies: [
        {
          id: "enemy",
          x: 6,
          y: 4,
          pattern: "horizontal",
          direction: DIRECTIONS.left,
          directionIndex: 2,
        },
      ],
      enemyTick: 2,
      fruit: { x: 0, y: 0 },
      rainbowApple: { x: 0, y: 1 },
    };

    expect(stepGame(state).lifecycle).toBe("game-over");
  });

  it("activates invincibility and grows after eating a rainbow apple", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8, gameMode: "campaign" })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      enemies: [],
      fruit: { x: 0, y: 0 },
      rainbowApple: { x: 5, y: 4 },
      score: 0,
    };

    const next = stepGame(state);

    expect(next.snake).toHaveLength(4);
    expect(next.rainbowApple).toBeNull();
    expect(next.invincibilityTicks).toBe(45);
    expect(next.score).toBe(2);
    expect(next.applesEaten).toBe(0);
    expect(next.rainbowApplesEaten).toBe(1);
  });

  it("completes a campaign level after its required apple", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 8, gameMode: "campaign" })),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      fruit: { x: 5, y: 4 },
      applesEaten: 2,
      applesRequired: 3,
    };

    const next = stepGame(state);

    expect(next.lifecycle).toBe("level-complete");
    expect(next.applesEaten).toBe(3);
    expect(next.score).toBe(1);
    expect(next.fruit).toBeNull();
  });

  it("advances to a harder campaign level while preserving score", () => {
    const completed = {
      ...createGameState({
        gameMode: "campaign",
        score: 7,
        totalApplesEaten: 9,
        enemiesDefeated: 4,
        rainbowApplesEaten: 1,
        debugMode: true,
      }),
      lifecycle: "level-complete",
      level: 2,
    };

    const next = advanceCampaignLevel(completed, () => 0);

    expect(next.lifecycle).toBe("running");
    expect(next.level).toBe(3);
    expect(next.score).toBe(7);
    expect(next.applesEaten).toBe(0);
    expect(next.totalApplesEaten).toBe(9);
    expect(next.enemiesDefeated).toBe(4);
    expect(next.rainbowApplesEaten).toBe(1);
    expect(next.debugMode).toBe(true);
    expect(next.applesRequired).toBe(7);
    expect(next.walls.length).toBeGreaterThan(completed.walls.length);
  });

  it("turns boss-level apples into ammunition", () => {
    const state = {
      ...startGame(
        createGameState({
          gridSize: 8,
          gameMode: "campaign",
          level: 5,
        }),
      ),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      boss: {
        x: 7,
        y: 7,
        type: "hunter",
        name: "The Hunter",
        hp: 3,
        maxHp: 3,
        direction: DIRECTIONS.left,
      },
      fruit: { x: 5, y: 4 },
    };

    const next = stepGame(state, () => 0);

    expect(next.appleAmmo).toBe(1);
    expect(next.totalApplesEaten).toBe(1);
    expect(next.lifecycle).toBe("running");
    expect(next.fruit).not.toBeNull();
  });

  it("fires an apple projectile in the snake's direction", () => {
    const state = {
      ...startGame(
        createGameState({
          gridSize: 8,
          gameMode: "campaign",
          level: 5,
        }),
      ),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      boss: {
        x: 7,
        y: 4,
        type: "hunter",
        name: "The Hunter",
        hp: 3,
        maxHp: 3,
        direction: DIRECTIONS.left,
      },
      appleAmmo: 1,
    };

    const fired = spitApple(state);

    expect(fired.appleAmmo).toBe(0);
    expect(fired.appleProjectiles).toEqual([
      {
        x: 5,
        y: 4,
        direction: DIRECTIONS.right,
      },
    ]);

    const turned = queueDirection(fired, "up");
    const hit = stepGame(turned);
    expect(hit.boss.hp).toBe(2);
  });

  it("lets apple shots destroy boss-spawned minions", () => {
    const state = {
      ...startGame(
        createGameState({
          gridSize: 8,
          gameMode: "campaign",
          level: 5,
        }),
      ),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      enemies: [
        {
          id: "boss-minion",
          x: 5,
          y: 4,
          pattern: "horizontal",
          direction: DIRECTIONS.right,
          directionIndex: 0,
        },
      ],
      appleAmmo: 1,
      score: 0,
    };

    const fired = spitApple(state);

    expect(fired.enemies).toHaveLength(0);
    expect(fired.enemiesDefeated).toBe(1);
    expect(fired.score).toBe(2);
    expect(fired.boss.hp).toBe(3);
  });

  it("adds a boss-spawned minion to the active arena", () => {
    const state = {
      ...startGame(
        createGameState({
          gridSize: 12,
          gameMode: "campaign",
          level: 5,
          edgeMode: "wrap",
        }),
      ),
      snake: [
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
      ],
      walls: [],
      enemies: [],
      boss: {
        x: 1,
        y: 1,
        type: "hunter",
        name: "The Hunter",
        level: 5,
        hp: 3,
        maxHp: 3,
        direction: DIRECTIONS.right,
      },
      bossTick: 17,
      fruit: { x: 0, y: 11 },
    };

    const next = stepGame(state);

    expect(next.enemies).toHaveLength(1);
    expect(next.enemies[0].id).toBe("boss-minion-5-18");
  });

  it("completes a boss level after the third apple hit", () => {
    let state = {
      ...startGame(
        createGameState({
          gridSize: 8,
          gameMode: "campaign",
          level: 5,
        }),
      ),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      boss: {
        x: 5,
        y: 4,
        type: "hunter",
        name: "The Hunter",
        hp: 3,
        maxHp: 3,
        direction: DIRECTIONS.left,
      },
    };

    for (let hit = 0; hit < 3; hit += 1) {
      state = spitApple({ ...state, appleAmmo: 1 });
    }

    expect(state.boss.hp).toBe(0);
    expect(state.lifecycle).toBe("level-complete");
    expect(state.bossesDefeated).toBe(1);
  });

  it("ends the game when a boss projectile reaches the snake", () => {
    const state = {
      ...startGame(
        createGameState({
          gridSize: 8,
          gameMode: "campaign",
          level: 10,
        }),
      ),
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
      bossProjectiles: [
        {
          x: 4,
          y: 3,
          direction: DIRECTIONS.down,
        },
      ],
    };

    expect(stepGame(state).lifecycle).toBe("game-over");
  });

  describe("game lifecycle", () => {
    it("pauses and resumes only from matching states", () => {
      const ready = createGameState();
      const running = startGame(ready);
      const paused = pauseGame(running);

      expect(paused.lifecycle).toBe("paused");
      expect(pauseGame(ready)).toBe(ready);
      expect(resumeGame(paused).lifecycle).toBe("running");
      expect(resumeGame(running)).toBe(running);
    });

    it("does not move while paused", () => {
      const paused = pauseGame(startGame(createGameState()));

      expect(stepGame(paused)).toBe(paused);
    });
  });

  it("allows movement into the cell the tail is leaving", () => {
    const state = {
      ...startGame(createGameState({ gridSize: 5 })),
      snake: [
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
      ],
      direction: DIRECTIONS.left,
      queuedDirection: DIRECTIONS.left,
      fruit: { x: 4, y: 4 },
    };

    const next = stepGame(state);

    expect(next.lifecycle).toBe("running");
    expect(next.snake[0]).toEqual({ x: 1, y: 1 });
  });

  it("completes the game when eating fills the board", () => {
    const state = {
      gridSize: 2,
      snake: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      direction: DIRECTIONS.right,
      queuedDirection: DIRECTIONS.right,
      fruit: { x: 1, y: 0 },
      score: 0,
      lifecycle: "running",
      completed: false,
    };

    const next = stepGame(state);

    expect(next.completed).toBe(true);
    expect(next.lifecycle).toBe("game-over");
    expect(next.score).toBe(1);
    expect(next.fruit).toBeNull();
  });
});

describe("fruit placement", () => {
  it("lists only empty cells", () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];

    expect(listEmptyCells(2, snake)).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it("uses the provided random source and reports a full board", () => {
    expect(placeFruit(2, [{ x: 0, y: 0 }], () => 0.99)).toEqual({
      x: 1,
      y: 1,
    });
    expect(
      placeFruit(1, [{ x: 0, y: 0 }], () => 0),
    ).toBeNull();
  });
});
