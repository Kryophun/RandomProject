import { placeFruit } from "./fruit.js";

export const GRID_SIZE = 20;

export const DIRECTIONS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1 }),
  down: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 }),
  right: Object.freeze({ x: 1, y: 0 }),
});

function positionsMatch(first, second) {
  return first.x === second.x && first.y === second.y;
}

function isOpposite(first, second) {
  return first.x + second.x === 0 && first.y + second.y === 0;
}

function createInitialSnake(gridSize) {
  const center = Math.floor(gridSize / 2);

  return [
    { x: center + 1, y: center },
    { x: center, y: center },
    { x: center - 1, y: center },
  ];
}

export function createGameState({
  gridSize = GRID_SIZE,
  random = Math.random,
  lifecycle = "ready",
} = {}) {
  const snake = createInitialSnake(gridSize);

  return {
    gridSize,
    snake,
    direction: DIRECTIONS.right,
    queuedDirection: DIRECTIONS.right,
    fruit: placeFruit(gridSize, snake, random),
    score: 0,
    lifecycle,
    completed: false,
  };
}

export function startGame(state) {
  if (state.lifecycle !== "ready") {
    return state;
  }

  return { ...state, lifecycle: "running" };
}

export function queueDirection(state, directionName) {
  const nextDirection = DIRECTIONS[directionName];

  if (
    !nextDirection ||
    state.lifecycle !== "running" ||
    state.queuedDirection !== state.direction ||
    isOpposite(nextDirection, state.direction)
  ) {
    return state;
  }

  return { ...state, queuedDirection: nextDirection };
}

export function stepGame(state, random = Math.random) {
  if (state.lifecycle !== "running") {
    return state;
  }

  const direction = state.queuedDirection;
  const head = state.snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  if (hitWall) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      lifecycle: "game-over",
    };
  }

  const ateFruit = positionsMatch(nextHead, state.fruit);
  const collisionSegments = ateFruit
    ? state.snake
    : state.snake.slice(0, -1);
  const hitSnake = collisionSegments.some((segment) =>
    positionsMatch(segment, nextHead),
  );

  if (hitSnake) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      lifecycle: "game-over",
    };
  }

  const snake = [nextHead, ...state.snake];
  let fruit = state.fruit;
  let score = state.score;

  if (ateFruit) {
    score += 1;
    fruit = placeFruit(state.gridSize, snake, random);
  } else {
    snake.pop();
  }

  const completed = fruit === null;

  return {
    ...state,
    snake,
    direction,
    queuedDirection: direction,
    fruit,
    score,
    completed,
    lifecycle: completed ? "game-over" : "running",
  };
}
