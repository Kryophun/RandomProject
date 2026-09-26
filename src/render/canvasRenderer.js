const COLORS = Object.freeze({
  board: "#d8eeb5",
  grid: "rgba(68, 104, 58, 0.08)",
  snake: "#386641",
  snakeHead: "#24452b",
  fruit: "#e45f4f",
  fruitLeaf: "#568f43",
  wall: "#786857",
  wallHighlight: "#9a8874",
  enemy: "#7d3b73",
  enemyEye: "#fff8ea",
  boss: "#9f2f46",
  bossAccent: "#f4b942",
  bossProjectile: "#6d28d9",
  appleProjectile: "#e45f4f",
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

function drawSnakeSegment(
  context,
  segment,
  cellSize,
  isHead,
  invincibleHue = null,
) {
  const padding = cellSize * 0.1;
  const radius = cellSize * 0.22;
  const x = segment.x * cellSize + padding;
  const y = segment.y * cellSize + padding;
  const size = cellSize - padding * 2;

  context.fillStyle =
    invincibleHue === null
      ? isHead
        ? COLORS.snakeHead
        : COLORS.snake
      : `hsl(${invincibleHue} 78% 48%)`;
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.fill();
}

function drawRainbowApple(context, apple, cellSize) {
  if (!apple) {
    return;
  }

  const centerX = (apple.x + 0.5) * cellSize;
  const centerY = (apple.y + 0.55) * cellSize;
  const gradient = context.createLinearGradient(
    centerX - cellSize * 0.3,
    centerY - cellSize * 0.3,
    centerX + cellSize * 0.3,
    centerY + cellSize * 0.3,
  );

  gradient.addColorStop(0, "#ef4444");
  gradient.addColorStop(0.2, "#f59e0b");
  gradient.addColorStop(0.4, "#eab308");
  gradient.addColorStop(0.6, "#22c55e");
  gradient.addColorStop(0.8, "#3b82f6");
  gradient.addColorStop(1, "#a855f7");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.31, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f8fafc";
  context.beginPath();
  context.arc(
    centerX - cellSize * 0.1,
    centerY - cellSize * 0.12,
    cellSize * 0.07,
    0,
    Math.PI * 2,
  );
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

function drawEnemy(context, enemy, cellSize) {
  const centerX = (enemy.x + 0.5) * cellSize;
  const centerY = (enemy.y + 0.5) * cellSize;
  const radius = cellSize * 0.34;

  context.fillStyle =
    enemy.pattern === "horizontal"
      ? "#9f3f64"
      : enemy.pattern === "vertical"
        ? "#6d4aae"
        : COLORS.enemy;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  const eyeOffsetX = cellSize * 0.12;
  const eyeOffsetY = cellSize * 0.06;
  context.fillStyle = COLORS.enemyEye;

  for (const offset of [-eyeOffsetX, eyeOffsetX]) {
    context.beginPath();
    context.arc(
      centerX + offset,
      centerY - eyeOffsetY,
      cellSize * 0.07,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

function drawProjectile(context, projectile, cellSize, color, radius) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(
    (projectile.x + 0.5) * cellSize,
    (projectile.y + 0.5) * cellSize,
    cellSize * radius,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function drawBoss(context, boss, cellSize) {
  if (!boss) {
    return;
  }

  const centerX = (boss.x + 0.5) * cellSize;
  const centerY = (boss.y + 0.5) * cellSize;
  const radius = cellSize * 0.92;

  context.fillStyle =
    boss.type === "hunter"
      ? "#9f2f46"
      : boss.type === "turret"
        ? "#6d3f9c"
        : "#b45309";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.bossAccent;
  context.beginPath();
  context.moveTo(centerX - radius * 0.7, centerY - radius * 0.55);
  context.lineTo(centerX - radius * 0.3, centerY - radius * 1.05);
  context.lineTo(centerX - radius * 0.05, centerY - radius * 0.55);
  context.fill();
  context.beginPath();
  context.moveTo(centerX + radius * 0.7, centerY - radius * 0.55);
  context.lineTo(centerX + radius * 0.3, centerY - radius * 1.05);
  context.lineTo(centerX + radius * 0.05, centerY - radius * 0.55);
  context.fill();

  context.fillStyle = COLORS.enemyEye;
  for (const offset of [-cellSize * 0.28, cellSize * 0.28]) {
    context.beginPath();
    context.arc(
      centerX + offset,
      centerY - cellSize * 0.1,
      cellSize * 0.13,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  const healthWidth = cellSize * 1.9;
  const healthX = centerX - healthWidth / 2;
  const healthY = centerY + radius + cellSize * 0.08;
  context.fillStyle = "rgba(32, 48, 32, 0.35)";
  context.fillRect(healthX, healthY, healthWidth, cellSize * 0.12);
  context.fillStyle = "#ef4444";
  context.fillRect(
    healthX,
    healthY,
    healthWidth * Math.max(0, boss.hp / boss.maxHp),
    cellSize * 0.12,
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
  drawRainbowApple(context, state.rainbowApple, cellSize);
  state.enemies?.forEach((enemy) => drawEnemy(context, enemy, cellSize));
  state.bossProjectiles?.forEach((projectile) =>
    drawProjectile(
      context,
      projectile,
      cellSize,
      COLORS.bossProjectile,
      0.16,
    ),
  );
  state.appleProjectiles?.forEach((projectile) =>
    drawProjectile(
      context,
      projectile,
      cellSize,
      COLORS.appleProjectile,
      0.18,
    ),
  );
  drawBoss(context, state.boss, cellSize);

  state.snake
    .slice()
    .reverse()
    .forEach((segment, reverseIndex) => {
      const isHead = reverseIndex === state.snake.length - 1;
      const invincibleHue =
        state.invincibilityTicks > 0
          ? (reverseIndex * 48 + state.enemyTick * 16) % 360
          : null;
      drawSnakeSegment(
        context,
        segment,
        cellSize,
        isHead,
        invincibleHue,
      );
    });
}
