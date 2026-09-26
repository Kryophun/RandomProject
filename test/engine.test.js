import { describe, expect, it } from "vitest";
import {
  DIRECTIONS,
  createGameState,
  pauseGame,
  queueDirection,
  resumeGame,
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
