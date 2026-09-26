import "./styles.css";
import {
  createGameState,
  pauseGame,
  queueDirection,
  resumeGame,
  startGame,
  stepGame,
} from "./game/engine.js";
import { getTickInterval } from "./game/speed.js";
import {
  directionForKey,
  directionForSwipe,
} from "./input/controls.js";
import { renderGame } from "./render/canvasRenderer.js";
import { readHighScore, writeHighScore } from "./storage/highScore.js";

const canvas = document.querySelector("#game-board");
const context = canvas.getContext("2d");
const boardWrap = document.querySelector("#board-wrap");
const score = document.querySelector("#score");
const highScoreDisplay = document.querySelector("#high-score");
const overlay = document.querySelector("#game-overlay");
const message = document.querySelector("#game-message");
const modeSelector = document.querySelector("#mode-selector");
const primaryAction = document.querySelector("#primary-action");
const pauseAction = document.querySelector("#pause-action");
const status = document.querySelector("#game-status");
const directionButtons = document.querySelectorAll("[data-direction]");

let state = createGameState();
let timerId = null;
let highScore = readHighScore();
let pointerStart = null;

function stopTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function scheduleTick() {
  stopTimer();
  timerId = window.setTimeout(runTick, getTickInterval(state.score));
}

function updateHighScore() {
  if (state.score <= highScore) {
    return;
  }

  highScore = state.score;
  writeHighScore(highScore);
}

function updateInterface() {
  updateHighScore();
  score.textContent = String(state.score);
  highScoreDisplay.textContent = String(highScore);
  renderGame(context, state);
  canvas.dataset.lifecycle = state.lifecycle;
  canvas.dataset.edgeMode = state.edgeMode;
  canvas.dataset.direction = Object.entries(
    {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    },
  ).find(([, direction]) =>
    direction.x === state.direction.x && direction.y === state.direction.y
  )?.[0] ?? "right";
  canvas.dataset.head = `${state.snake[0].x},${state.snake[0].y}`;
  canvas.dataset.score = String(state.score);

  const isReady = state.lifecycle === "ready";
  const isPaused = state.lifecycle === "paused";
  const isGameOver = state.lifecycle === "game-over";
  overlay.hidden = !isReady && !isPaused && !isGameOver;
  modeSelector.hidden = isPaused;
  pauseAction.disabled = isReady || isGameOver;
  pauseAction.textContent = isPaused ? "Resume" : "Pause";

  if (isReady) {
    message.textContent = "Use arrow keys or WASD to guide the snake.";
    primaryAction.textContent = "Start game";
    status.textContent = "Ready to play";
    canvas.setAttribute("aria-label", "Snake board. Ready to play.");
  } else if (isPaused) {
    message.textContent = "Game paused";
    primaryAction.textContent = "Resume";
    status.textContent = "Game paused";
    canvas.setAttribute(
      "aria-label",
      `Snake board paused at score ${state.score}.`,
    );
  } else if (isGameOver) {
    message.textContent = state.completed
      ? `Board complete! Final score: ${state.score}`
      : `Game over. Final score: ${state.score}`;
    primaryAction.textContent = "Play again";
    status.textContent = state.completed ? "Board complete" : "Game over";
    canvas.setAttribute(
      "aria-label",
      `${state.completed ? "Board complete" : "Game over"} at score ${state.score}.`,
    );
  } else {
    const modeLabel = state.edgeMode === "wrap" ? "Wrap" : "Walls";
    status.textContent = `${modeLabel} mode - speed ${state.speedTier + 1}`;
    canvas.setAttribute(
      "aria-label",
      `Snake board in progress. Score ${state.score}. ${modeLabel} mode.`,
    );
  }
}

function runTick() {
  timerId = null;
  state = stepGame(state);
  updateInterface();

  if (state.lifecycle === "running") {
    scheduleTick();
  }
}

function beginGame() {
  stopTimer();
  const edgeMode = document.querySelector(
    'input[name="edge-mode"]:checked',
  ).value;
  state = startGame(createGameState({ edgeMode }));
  updateInterface();
  scheduleTick();
}

function togglePause() {
  if (state.lifecycle === "running") {
    stopTimer();
    state = pauseGame(state);
  } else if (state.lifecycle === "paused") {
    state = resumeGame(state);
    scheduleTick();
  } else {
    return;
  }

  updateInterface();
}

function issueDirection(direction) {
  state = queueDirection(state, direction);
  updateInterface();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const displaySize = Math.max(1, Math.round(bounds.width * pixelRatio));

  if (canvas.width !== displaySize || canvas.height !== displaySize) {
    canvas.width = displaySize;
    canvas.height = displaySize;
    updateInterface();
  }
}

primaryAction.addEventListener("click", () => {
  if (state.lifecycle === "paused") {
    togglePause();
  } else {
    beginGame();
  }
});

pauseAction.addEventListener("click", togglePause);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  const direction = directionForKey(event.key);

  if (!direction) {
    return;
  }

  event.preventDefault();
  issueDirection(direction);
});

directionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    issueDirection(button.dataset.direction);
  });
});

canvas.addEventListener("pointerdown", (event) => {
  if (state.lifecycle !== "running") {
    return;
  }

  pointerStart = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture?.(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart) {
    return;
  }

  const direction = directionForSwipe(pointerStart, {
    x: event.clientX,
    y: event.clientY,
  });
  pointerStart = null;

  if (direction) {
    issueDirection(direction);
  }
});

canvas.addEventListener("pointercancel", () => {
  pointerStart = null;
});

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(boardWrap);

updateInterface();
requestAnimationFrame(resizeCanvas);
