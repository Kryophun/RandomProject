const PATTERNS = Object.freeze(["horizontal", "vertical", "clockwise"]);
const CLOCKWISE_DIRECTIONS = Object.freeze([
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 0, y: -1 }),
]);

function positionKey({ x, y }) {
  return `${x},${y}`;
}

function createSeededRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function isBlocked(position, gridSize, blocked) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize ||
    blocked.has(positionKey(position))
  );
}

function movePatrolEnemy(enemy, gridSize, blocked) {
  const proposed = {
    x: enemy.x + enemy.direction.x,
    y: enemy.y + enemy.direction.y,
  };

  if (!isBlocked(proposed, gridSize, blocked)) {
    return { ...enemy, ...proposed };
  }

  const reversedDirection = {
    x: enemy.direction.x === 0 ? 0 : -enemy.direction.x,
    y: enemy.direction.y === 0 ? 0 : -enemy.direction.y,
  };
  const reversed = {
    x: enemy.x + reversedDirection.x,
    y: enemy.y + reversedDirection.y,
  };

  return isBlocked(reversed, gridSize, blocked)
    ? { ...enemy, direction: reversedDirection }
    : { ...enemy, ...reversed, direction: reversedDirection };
}

function moveClockwiseEnemy(enemy, gridSize, blocked) {
  for (let turnOffset = 0; turnOffset < 4; turnOffset += 1) {
    const directionIndex = (enemy.directionIndex + turnOffset) % 4;
    const direction = CLOCKWISE_DIRECTIONS[directionIndex];
    const proposed = {
      x: enemy.x + direction.x,
      y: enemy.y + direction.y,
    };

    if (!isBlocked(proposed, gridSize, blocked)) {
      return {
        ...enemy,
        ...proposed,
        direction,
        directionIndex,
      };
    }
  }

  return enemy;
}

export function getEnemyMoveInterval(level) {
  return Math.max(1, 3 - Math.floor((Math.max(1, level) - 1) / 4));
}

export function createCampaignEnemies(
  gridSize,
  level,
  count,
  snake,
  walls,
) {
  const blocked = new Set([...snake, ...walls].map(positionKey));
  const head = snake[0];
  const candidates = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const position = { x, y };
      const distanceFromHead =
        Math.abs(position.x - head.x) + Math.abs(position.y - head.y);

      if (!blocked.has(positionKey(position)) && distanceFromHead > 7) {
        candidates.push(position);
      }
    }
  }

  const random = createSeededRandom(level * 65537 + gridSize * 257);
  const enemies = [];

  while (candidates.length > 0 && enemies.length < count) {
    const index = Math.floor(random() * candidates.length);
    const [position] = candidates.splice(index, 1);
    const pattern = PATTERNS[enemies.length % PATTERNS.length];
    const directionIndex = enemies.length % CLOCKWISE_DIRECTIONS.length;
    const direction =
      pattern === "vertical"
        ? { x: 0, y: 1 }
        : CLOCKWISE_DIRECTIONS[directionIndex];

    enemies.push({
      id: `enemy-${level}-${enemies.length}`,
      ...position,
      pattern,
      direction,
      directionIndex,
    });
  }

  return enemies;
}

export function moveEnemies(
  enemies,
  {
    gridSize,
    walls = [],
    protectedCells = [],
  },
) {
  const occupied = new Set();
  const fixedBlocked = new Set([...walls, ...protectedCells].map(positionKey));

  return enemies.map((enemy, index) => {
    const otherEnemies = enemies.filter((_, otherIndex) => otherIndex !== index);
    const blocked = new Set([
      ...fixedBlocked,
      ...otherEnemies.map(positionKey),
      ...occupied,
    ]);
    const moved =
      enemy.pattern === "clockwise"
        ? moveClockwiseEnemy(enemy, gridSize, blocked)
        : movePatrolEnemy(enemy, gridSize, blocked);

    occupied.add(positionKey(moved));
    return moved;
  });
}
