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
    direction: { x: -1, y: 0 },
  };
}

export function advanceBoss(
  boss,
  {
    gridSize,
    walls = [],
    snake,
    tick,
  },
) {
  if (!boss) {
    return { boss: null, projectile: null };
  }

  const blocked = new Set(walls.map(positionKey));
  const target = snake[0];

  if (boss.type === "hunter" && tick % 2 === 0) {
    return {
      boss: moveToward(boss, target, gridSize, blocked),
      projectile: null,
    };
  }

  if (boss.type === "charger" && tick % 4 === 0) {
    return {
      boss: moveToward(boss, target, gridSize, blocked, 2),
      projectile: null,
    };
  }

  if (boss.type === "turret" && tick % 3 === 0) {
    const [direction] = directionsToward(boss, target);

    return {
      boss,
      projectile: direction
        ? {
            x: boss.x,
            y: boss.y,
            direction,
          }
        : null,
    };
  }

  return { boss, projectile: null };
}

export { BOSS_TYPES };
