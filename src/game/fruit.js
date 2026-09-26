export function listEmptyCells(gridSize, snake) {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`));
  const emptyCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        emptyCells.push({ x, y });
      }
    }
  }

  return emptyCells;
}

export function placeFruit(gridSize, snake, random = Math.random) {
  const emptyCells = listEmptyCells(gridSize, snake);

  if (emptyCells.length === 0) {
    return null;
  }

  const randomIndex = Math.min(
    Math.floor(random() * emptyCells.length),
    emptyCells.length - 1,
  );

  return emptyCells[randomIndex];
}
