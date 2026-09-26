const BOSS_TYPES = Object.freeze([
  Object.freeze({
    type: "hunter",
    name: "The Hunter",
  }),
  Object.freeze({
    type: "turret",
    name: "The Orchard Cannon",
  }),
  Object.freeze({
    type: "charger",
    name: "The Ram",
  }),
]);

function positionKey({ x, y }) {
  return `${x},${y}`;
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

function directionsToward(from, to) {
  const horizontal = {
    x: Math.sign(to.x - from.x),
    y: 0,
  };
  const vertical = {
    x: 0,
    y: Math.sign(to.y - from.y),
  };
  const horizontalDistance = Math.abs(to.x - from.x);
  const verticalDistance = Math.abs(to.y - from.y);
  const ordered =
    horizontalDistance >= verticalDistance
      ? [horizontal, vertical]
      : [vertical, horizontal];

  return ordered.filter(({ x, y }) => x !== 0 || y !== 0);
}

function moveToward(boss, target, gridSize, blocked, distance = 1) {
  let moved = { ...boss };

  for (let step = 0; step < distance; step += 1) {
    const directions = directionsToward(moved, target);
    const direction = directions.find((candidate) => {
      const proposed = {
        x: moved.x + candidate.x,
        y: moved.y + candidate.y,
      };
      return !isBlocked(proposed, gridSize, blocked);
    });

    if (!direction) {
      break;
    }

    moved = {
      ...moved,
      x: moved.x + direction.x,
      y: moved.y + direction.y,
      direction,
    };
  }

  return moved;
}

function createSpawnedEnemy(
  boss,
  {
    gridSize,
    walls,
    snake,
    enemies,
    protectedCells,
    tick,
  },
) {
  const blocked = new Set(
    [
      ...walls,
      ...snake,
      ...enemies,
      ...protectedCells,
      boss,
    ].map(positionKey),
  );
  const offsets = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 },
    { x: 0, y: -2 },
  ];
  const startIndex = tick % offsets.length;

  for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex += 1) {
    const offset = offsets[(startIndex + offsetIndex) % offsets.length];
    const position = {
      x: boss.x + offset.x,
      y: boss.y + offset.y,
    };

    if (isBlocked(position, gridSize, blocked)) {
      continue;
    }

    const pattern =
      boss.type === "hunter"
        ? "horizontal"
        : boss.type === "turret"
          ? "vertical"
          : "clockwise";
    const direction =
      pattern === "vertical" ? { x: 0, y: 1 } : { x: 1, y: 0 };

    return {
      id: `boss-minion-${boss.level}-${tick}`,
      ...position,
      pattern,
      direction,
      directionIndex: 0,
    };
  }

  return null;
}

export function isBossLevel(level) {
  return level > 0 && level % 5 === 0;
}

export function createCampaignBoss(gridSize, level, snake, walls) {
  if (!isBossLevel(level)) {
    return null;
  }

  const blocked = new Set([...snake, ...walls].map(positionKey));
  const head = snake[0];
  const candidates = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const position = { x, y };

      if (!blocked.has(positionKey(position))) {
        candidates.push({
          ...position,
          distance:
            Math.abs(position.x - head.x) + Math.abs(position.y - head.y),
        });
      }
    }
  }

  candidates.sort((first, second) => second.distance - first.distance);
  const encounter = level / 5;
  const bossType = BOSS_TYPES[(encounter - 1) % BOSS_TYPES.length];
  const spawnPool = candidates.slice(0, Math.max(1, gridSize));
  const spawn = spawnPool[(encounter * 7) % spawnPool.length];

  return {
    ...bossType,
    x: spawn.x,
    y: spawn.y,
    hp: 3,
    maxHp: 3,
    level,
    direction: { x: -1, y: 0 },
  };
}

export function advanceBoss(
  boss,
  {
    gridSize,
    walls = [],
    snake,
    enemies = [],
    protectedCells = [],
    tick,
  },
) {
  if (!boss) {
    return { boss: null, projectile: null, spawnedEnemy: null };
  }

  const blocked = new Set([...walls, ...enemies].map(positionKey));
  const target = snake[0];
  let nextBoss = boss;
  let projectile = null;

  if (boss.type === "hunter" && tick % 4 === 0) {
    nextBoss = moveToward(boss, target, gridSize, blocked);
  }

  if (boss.type === "charger" && tick % 8 === 0) {
    nextBoss = moveToward(boss, target, gridSize, blocked, 2);
  }

  if (boss.type === "turret" && tick % 6 === 0) {
    const [direction] = directionsToward(boss, target);

    projectile = direction
      ? {
          x: boss.x,
          y: boss.y,
          direction,
        }
      : null;
  }

  const spawnInterval =
    boss.type === "hunter" ? 12 : boss.type === "turret" ? 10 : 14;
  const maxMinions = Math.min(4, 1 + Math.floor(boss.level / 10));
  const spawnedEnemy =
    tick % spawnInterval === 0 && enemies.length < maxMinions
      ? createSpawnedEnemy(nextBoss, {
          gridSize,
          walls,
          snake,
          enemies,
          protectedCells,
          tick,
        })
      : null;

  return { boss: nextBoss, projectile, spawnedEnemy };
}

export { BOSS_TYPES };
