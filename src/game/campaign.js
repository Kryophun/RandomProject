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
  };
}

export function createCampaignLevel(gridSize, level, snake) {
  const { applesRequired, wallCount } = getCampaignRequirements(
    level,
    gridSize,
  );
  const occupied = new Set(snake.map(positionKey));
  const head = snake[0];
  const candidates = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const position = { x, y };
      const distanceFromHead =
        Math.abs(position.x - head.x) + Math.abs(position.y - head.y);

      if (!occupied.has(positionKey(position)) && distanceFromHead > 3) {
        candidates.push(position);
      }
    }
  }

  const random = createSeededRandom(level * 104729 + gridSize * 8191);
  const walls = [];

  for (const candidate of shuffle(candidates, random)) {
    if (walls.length >= wallCount) {
      break;
    }

    const proposedWalls = [...walls, candidate];

    if (isOpenBoardConnected(gridSize, proposedWalls, head)) {
      walls.push(candidate);
    }
  }

  return { applesRequired, walls };
}
