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

function shuffle(items, random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function createFormations(gridSize, level) {
  const formations = [];
  const barLength = Math.min(7, 3 + Math.floor(level / 3));

  for (let y = 2; y < gridSize - 2; y += 2) {
    for (let x = 2; x < gridSize - 2; x += 2) {
      formations.push(
        Array.from({ length: barLength }, (_, offset) => ({
          x: x + offset,
          y,
        })),
      );
      formations.push(
        Array.from({ length: barLength }, (_, offset) => ({
          x,
          y: y + offset,
        })),
      );
      formations.push([
        { x, y },
        { x: x + 1, y },
        { x: x + 2, y },
        { x, y: y + 1 },
        { x, y: y + 2 },
      ]);
    }
  }

  return formations;
}

function isOpenBoardConnected(gridSize, walls, start) {
  const blocked = new Set(walls.map(positionKey));
  const startKey = positionKey(start);

  if (blocked.has(startKey)) {
    return false;
  }

  const queue = [start];
  const visited = new Set([startKey]);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      const key = positionKey(neighbor);
      const insideBoard =
        neighbor.x >= 0 &&
        neighbor.y >= 0 &&
        neighbor.x < gridSize &&
        neighbor.y < gridSize;

      if (insideBoard && !blocked.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === gridSize * gridSize - walls.length;
}

export function getCampaignRequirements(level, gridSize = 20) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const maximumWalls = Math.floor(gridSize * gridSize * 0.22);

  return {
    applesRequired: 3 + (normalizedLevel - 1) * 2,
    wallCount: Math.min(6 + (normalizedLevel - 1) * 4, maximumWalls),
    enemyCount: Math.min(8, 1 + Math.floor((normalizedLevel - 1) / 2)),
  };
}

export function createCampaignLevel(gridSize, level, snake) {
  const { applesRequired, wallCount, enemyCount } = getCampaignRequirements(
    level,
    gridSize,
  );
  const occupied = new Set(snake.map(positionKey));
  const head = snake[0];
  const random = createSeededRandom(level * 104729 + gridSize * 8191);
  const walls = [];
  const wallKeys = new Set();
  const isAllowed = (position) => {
    const insideBoard =
      position.x >= 1 &&
      position.y >= 1 &&
      position.x < gridSize - 1 &&
      position.y < gridSize - 1;
    const distanceFromHead =
      Math.abs(position.x - head.x) + Math.abs(position.y - head.y);

    return (
      insideBoard &&
      distanceFromHead > 3 &&
      !occupied.has(positionKey(position)) &&
      !wallKeys.has(positionKey(position))
    );
  };

  for (const formation of shuffle(createFormations(gridSize, level), random)) {
    if (walls.length >= wallCount) {
      break;
    }

    const available = formation
      .filter(isAllowed)
      .slice(0, wallCount - walls.length);

    if (available.length < 2) {
      continue;
    }

    const proposedWalls = [...walls, ...available];

    if (!isOpenBoardConnected(gridSize, proposedWalls, head)) {
      continue;
    }

    for (const wall of available) {
      walls.push(wall);
      wallKeys.add(positionKey(wall));
    }
  }

  const adjacentCandidates = [];

  for (const wall of walls) {
    adjacentCandidates.push(
      { x: wall.x + 1, y: wall.y },
      { x: wall.x - 1, y: wall.y },
      { x: wall.x, y: wall.y + 1 },
      { x: wall.x, y: wall.y - 1 },
    );
  }

  for (const candidate of shuffle(adjacentCandidates, random)) {
    if (walls.length >= wallCount || !isAllowed(candidate)) {
      continue;
    }

    const proposedWalls = [...walls, candidate];

    if (isOpenBoardConnected(gridSize, proposedWalls, head)) {
      walls.push(candidate);
      wallKeys.add(positionKey(candidate));
    }
  }

  return { applesRequired, enemyCount, walls };
}
