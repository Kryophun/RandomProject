const COLORS = Object.freeze({
  board: "#d8eeb5",
  grid: "rgba(68, 104, 58, 0.08)",
  snake: "#386641",
  snakeHead: "#24452b",
  fruit: "#e45f4f",
  fruitLeaf: "#568f43",
  wall: "#786857",
  wallHighlight: "#9a8874",
});

function drawGrid(context, size, cellSize) {
  context.strokeStyle = COLORS.grid;
  context.lineWidth = 1;

  for (let index = 1; index < size; index += 1) {
    const offset = Math.round(index * cellSize) + 0.5;
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, context.canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(context.canvas.width, offset);
    context.stroke();
  }
}

function drawSnakeSegment(context, segment, cellSize, isHead) {
  const padding = cellSize * 0.1;
  const radius = cellSize * 0.22;
  const x = segment.x * cellSize + padding;
  const y = segment.y * cellSize + padding;
  const size = cellSize - padding * 2;

  context.fillStyle = isHead ? COLORS.snakeHead : COLORS.snake;
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.fill();
}

function drawFruit(context, fruit, cellSize) {
  if (!fruit) {
    return;
  }

  const centerX = (fruit.x + 0.5) * cellSize;
  const centerY = (fruit.y + 0.56) * cellSize;

  context.fillStyle = COLORS.fruit;
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.29, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.fruitLeaf;
  context.beginPath();
  context.ellipse(
    centerX + cellSize * 0.12,
    centerY - cellSize * 0.28,
    cellSize * 0.13,
    cellSize * 0.07,
    -0.6,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function drawWall(context, wall, cellSize) {
  const padding = cellSize * 0.08;
  const x = wall.x * cellSize + padding;
  const y = wall.y * cellSize + padding;
  const size = cellSize - padding * 2;

  context.fillStyle = COLORS.wall;
  context.beginPath();
  context.roundRect(x, y, size, size, cellSize * 0.12);
  context.fill();

  context.fillStyle = COLORS.wallHighlight;
  context.fillRect(
    x + size * 0.16,
    y + size * 0.18,
    size * 0.68,
    Math.max(1, size * 0.12),
  );
}

export function renderGame(context, state) {
  const { width, height } = context.canvas;
  const cellSize = width / state.gridSize;

  context.clearRect(0, 0, width, height);
  context.fillStyle = COLORS.board;
  context.fillRect(0, 0, width, height);
  drawGrid(context, state.gridSize, cellSize);
  state.walls?.forEach((wall) => drawWall(context, wall, cellSize));
  drawFruit(context, state.fruit, cellSize);

  state.snake
    .slice()
    .reverse()
    .forEach((segment, reverseIndex) => {
      const isHead = reverseIndex === state.snake.length - 1;
      drawSnakeSegment(context, segment, cellSize, isHead);
    });
}
