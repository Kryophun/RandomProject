import { placeFruit } from "./fruit.js";
import { getSpeedTier } from "./speed.js";
import { createCampaignLevel } from "./campaign.js";

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
  edgeMode = "walls",
  gameMode = "classic",
  level = 1,
  score = 0,
} = {}) {
  const snake = createInitialSnake(gridSize);
  const normalizedGameMode = gameMode === "campaign" ? "campaign" : "classic";
  const campaign =
    normalizedGameMode === "campaign"
      ? createCampaignLevel(gridSize, level, snake)
      : { applesRequired: 0, walls: [] };

  return {
    gridSize,
    snake,
    direction: DIRECTIONS.right,
    queuedDirection: DIRECTIONS.right,
    fruit: placeFruit(gridSize, snake, random, campaign.walls),
    score,
    speedTier: getSpeedTier(score),
    edgeMode: edgeMode === "wrap" ? "wrap" : "walls",
    gameMode: normalizedGameMode,
    level: Math.max(1, Math.floor(level)),
    applesEaten: 0,
    applesRequired: campaign.applesRequired,
    walls: campaign.walls,
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

export function pauseGame(state) {
  return state.lifecycle === "running"
    ? { ...state, lifecycle: "paused" }
    : state;
}

export function resumeGame(state) {
  return state.lifecycle === "paused"
    ? { ...state, lifecycle: "running" }
    : state;
}

export function advanceCampaignLevel(state, random = Math.random) {
  if (
    state.gameMode !== "campaign" ||
    state.lifecycle !== "level-complete"
  ) {
    return state;
  }

  return createGameState({
    gridSize: state.gridSize,
    random,
    lifecycle: "running",
    edgeMode: state.edgeMode,
    gameMode: "campaign",
    level: state.level + 1,
    score: state.score,
  });
}

export function stepGame(state, random = Math.random) {
  if (state.lifecycle !== "running") {
    return state;
  }

  const direction = state.queuedDirection;
  const head = state.snake[0];
  let nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  if (hitWall && state.edgeMode === "walls") {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      lifecycle: "game-over",
    };
  }

  if (hitWall) {
    nextHead = {
      x: (nextHead.x + state.gridSize) % state.gridSize,
      y: (nextHead.y + state.gridSize) % state.gridSize,
    };
  }

  const ateFruit = positionsMatch(nextHead, state.fruit);
  const collisionSegments = ateFruit
    ? state.snake
    : state.snake.slice(0, -1);
  const hitSnake = collisionSegments.some((segment) =>
    positionsMatch(segment, nextHead),
  );
  const hitObstacle = state.walls?.some((wall) =>
    positionsMatch(wall, nextHead),
  );

  if (hitSnake || hitObstacle) {
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
  let applesEaten = state.applesEaten ?? 0;
  let lifecycle = "running";

  if (ateFruit) {
    score += 1;
    applesEaten += 1;

    if (
      state.gameMode === "campaign" &&
      applesEaten >= state.applesRequired
    ) {
      fruit = null;
      lifecycle = "level-complete";
    } else {
      fruit = placeFruit(state.gridSize, snake, random, state.walls);
    }
  } else {
    snake.pop();
  }

  const completed = fruit === null && lifecycle !== "level-complete";

  return {
    ...state,
    snake,
    direction,
    queuedDirection: direction,
    fruit,
    score,
    applesEaten,
    speedTier: getSpeedTier(score),
    completed,
    lifecycle: completed ? "game-over" : lifecycle,
  };
}
