import { placeFruit } from "./fruit.js";
import { getSpeedTier } from "./speed.js";
import { createCampaignLevel } from "./campaign.js";
import {
  createCampaignEnemies,
  getEnemyMoveInterval,
  moveEnemies,
} from "./enemies.js";

export const GRID_SIZE = 20;
export const INVINCIBILITY_TICKS = 45;
const ENEMY_KILL_SCORE = 2;

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
  totalApplesEaten = 0,
  enemiesDefeated = 0,
  rainbowApplesEaten = 0,
} = {}) {
  const snake = createInitialSnake(gridSize);
  const normalizedGameMode = gameMode === "campaign" ? "campaign" : "classic";
  const campaign =
    normalizedGameMode === "campaign"
      ? createCampaignLevel(gridSize, level, snake)
      : { applesRequired: 0, enemyCount: 0, walls: [] };
  const enemies =
    normalizedGameMode === "campaign"
      ? createCampaignEnemies(
          gridSize,
          level,
          campaign.enemyCount,
          snake,
          campaign.walls,
        )
      : [];
  const occupiedByCampaign = [
    ...campaign.walls,
    ...enemies,
  ];
  const fruit = placeFruit(gridSize, snake, random, occupiedByCampaign);
  const rainbowApple =
    normalizedGameMode === "campaign"
      ? placeFruit(
          gridSize,
          snake,
          random,
          [...occupiedByCampaign, fruit].filter(Boolean),
        )
      : null;

  return {
    gridSize,
    snake,
    direction: DIRECTIONS.right,
    queuedDirection: DIRECTIONS.right,
    fruit,
    rainbowApple,
    score,
    speedTier: getSpeedTier(score),
    edgeMode: edgeMode === "wrap" ? "wrap" : "walls",
    gameMode: normalizedGameMode,
    level: Math.max(1, Math.floor(level)),
    applesEaten: 0,
    totalApplesEaten,
    applesRequired: campaign.applesRequired,
    walls: campaign.walls,
    enemies,
    enemiesDefeated,
    enemyTick: 0,
    invincibilityTicks: 0,
    rainbowApplesEaten,
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
    totalApplesEaten: state.totalApplesEaten,
    enemiesDefeated: state.enemiesDefeated,
    rainbowApplesEaten: state.rainbowApplesEaten,
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

  const ateFruit = state.fruit && positionsMatch(nextHead, state.fruit);
  const ateRainbow =
    state.rainbowApple && positionsMatch(nextHead, state.rainbowApple);
  const ateApple = ateFruit || ateRainbow;
  const collisionSegments = ateApple
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

  let enemies = state.enemies ?? [];
  let enemiesDefeated = state.enemiesDefeated ?? 0;
  let score = state.score;
  const headEnemy = enemies.find((enemy) => positionsMatch(enemy, nextHead));

  if (headEnemy) {
    if ((state.invincibilityTicks ?? 0) <= 0) {
      return {
        ...state,
        direction,
        queuedDirection: direction,
        lifecycle: "game-over",
      };
    }

    enemies = enemies.filter((enemy) => enemy.id !== headEnemy.id);
    enemiesDefeated += 1;
    score += ENEMY_KILL_SCORE;
  }

  const snake = [nextHead, ...state.snake];
  let fruit = state.fruit;
  let rainbowApple = state.rainbowApple ?? null;
  let applesEaten = state.applesEaten ?? 0;
  let totalApplesEaten = state.totalApplesEaten ?? 0;
  let rainbowApplesEaten = state.rainbowApplesEaten ?? 0;
  let lifecycle = "running";
  let invincibilityTicks = ateRainbow
    ? INVINCIBILITY_TICKS
    : Math.max(0, (state.invincibilityTicks ?? 0) - 1);

  if (ateFruit) {
    score += 1;
    applesEaten += 1;
    totalApplesEaten += 1;

    if (
      state.gameMode === "campaign" &&
      applesEaten >= state.applesRequired
    ) {
      fruit = null;
      lifecycle = "level-complete";
    } else {
      fruit = placeFruit(
        state.gridSize,
        snake,
        random,
        [
          ...(state.walls ?? []),
          ...enemies,
          rainbowApple,
        ].filter(Boolean),
      );
    }
  } else if (ateRainbow) {
    score += 2;
    rainbowApplesEaten += 1;
    rainbowApple = null;
  } else {
    snake.pop();
  }

  const completed = fruit === null && lifecycle !== "level-complete";
  let enemyTick = (state.enemyTick ?? 0) + 1;

  if (
    lifecycle === "running" &&
    enemies.length > 0 &&
    enemyTick % getEnemyMoveInterval(state.level) === 0
  ) {
    enemies = moveEnemies(enemies, {
      gridSize: state.gridSize,
      walls: state.walls,
      protectedCells: [fruit, rainbowApple].filter(Boolean),
    });

    const collidingEnemyIds = new Set(
      enemies
        .filter((enemy) =>
          snake.some((segment) => positionsMatch(segment, enemy)),
        )
        .map((enemy) => enemy.id),
    );

    if (collidingEnemyIds.size > 0) {
      if (invincibilityTicks <= 0) {
        lifecycle = "game-over";
      } else {
        enemies = enemies.filter(
          (enemy) => !collidingEnemyIds.has(enemy.id),
        );
        enemiesDefeated += collidingEnemyIds.size;
        score += collidingEnemyIds.size * ENEMY_KILL_SCORE;
      }
    }
  }

  return {
    ...state,
    snake,
    direction,
    queuedDirection: direction,
    fruit,
    rainbowApple,
    score,
    applesEaten,
    totalApplesEaten,
    enemies,
    enemiesDefeated,
    enemyTick,
    invincibilityTicks,
    rainbowApplesEaten,
    speedTier: getSpeedTier(score),
    completed,
    lifecycle: completed ? "game-over" : lifecycle,
  };
}
