import "./styles.css";
import {
  advanceCampaignLevel,
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
const campaignProgress = document.querySelector("#campaign-progress");
const campaignLevel = document.querySelector("#campaign-level");
const campaignApples = document.querySelector("#campaign-apples");
const overlay = document.querySelector("#game-overlay");
const message = document.querySelector("#game-message");
const modeSelector = document.querySelector("#mode-selector");
const gameModeSelector = document.querySelector("#game-mode-selector");
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
  canvas.dataset.gameMode = state.gameMode;
  canvas.dataset.level = String(state.level);
  canvas.dataset.wallCount = String(state.walls?.length ?? 0);
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
  const isLevelComplete = state.lifecycle === "level-complete";
  const isCampaign = state.gameMode === "campaign";
  overlay.hidden = !isReady && !isPaused && !isGameOver && !isLevelComplete;
  modeSelector.hidden = isPaused || isLevelComplete;
  gameModeSelector.hidden = isPaused || isLevelComplete;
  pauseAction.disabled = isReady || isGameOver || isLevelComplete;
  pauseAction.textContent = isPaused ? "Resume" : "Pause";
  campaignProgress.hidden = !isCampaign;
  campaignLevel.textContent = String(state.level);
  campaignApples.textContent = `${state.applesEaten} / ${state.applesRequired}`;

  if (isReady) {
    message.textContent = "Choose a game mode, then guide the snake to apples.";
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
  } else if (isLevelComplete) {
    message.textContent = `Level ${state.level} complete! ${state.applesEaten} apples eaten.`;
    primaryAction.textContent = `Start level ${state.level + 1}`;
    status.textContent = `Level ${state.level} complete`;
    canvas.setAttribute(
      "aria-label",
      `Campaign level ${state.level} complete at score ${state.score}.`,
    );
  } else if (isGameOver) {
    message.textContent = state.completed
      ? `Board complete! Final score: ${state.score}`
      : `${isCampaign ? `Campaign ended on level ${state.level}. ` : ""}Final score: ${state.score}`;
    primaryAction.textContent = "Play again";
    status.textContent = state.completed ? "Board complete" : "Game over";
    canvas.setAttribute(
      "aria-label",
      `${state.completed ? "Board complete" : "Game over"} at score ${state.score}.`,
    );
  } else {
    const modeLabel = state.edgeMode === "wrap" ? "Wrap" : "Walls";
    status.textContent = isCampaign
      ? `Campaign level ${state.level} - ${state.applesEaten}/${state.applesRequired} apples`
      : `${modeLabel} mode - speed ${state.speedTier + 1}`;
    canvas.setAttribute(
      "aria-label",
      `Snake board in progress. Score ${state.score}. ${
        isCampaign
          ? `Campaign level ${state.level}, ${state.applesEaten} of ${state.applesRequired} apples.`
          : `${modeLabel} mode.`
      }`,
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
  const gameMode = document.querySelector(
    'input[name="game-mode"]:checked',
  ).value;
  state = startGame(createGameState({ edgeMode, gameMode }));
  updateInterface();
  scheduleTick();
}

function startNextCampaignLevel() {
  stopTimer();
  state = advanceCampaignLevel(state);
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
  } else if (state.lifecycle === "level-complete") {
    startNextCampaignLevel();
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
