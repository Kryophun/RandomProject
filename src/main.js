import "./styles.css";
import {
  createGameState,
  queueDirection,
  startGame,
  stepGame,
} from "./game/engine.js";
import { directionForKey } from "./input/controls.js";
import { renderGame } from "./render/canvasRenderer.js";

const TICK_INTERVAL = 130;

const canvas = document.querySelector("#game-board");
const context = canvas.getContext("2d");
const score = document.querySelector("#score");
const overlay = document.querySelector("#game-overlay");
const message = document.querySelector("#game-message");
const primaryAction = document.querySelector("#primary-action");
const status = document.querySelector("#game-status");

let state = createGameState();
let timerId = null;

function stopTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function scheduleTick() {
  stopTimer();
  timerId = window.setTimeout(runTick, TICK_INTERVAL);
}

function updateInterface() {
  score.textContent = String(state.score);
  renderGame(context, state);

  const isReady = state.lifecycle === "ready";
  const isGameOver = state.lifecycle === "game-over";
  overlay.hidden = !isReady && !isGameOver;

  if (isReady) {
    message.textContent = "Use arrow keys or WASD to guide the snake.";
    primaryAction.textContent = "Start game";
    status.textContent = "Ready to play";
  } else if (isGameOver) {
    message.textContent = state.completed
      ? `Board complete! Final score: ${state.score}`
      : `Game over. Final score: ${state.score}`;
    primaryAction.textContent = "Play again";
    status.textContent = state.completed ? "Board complete" : "Game over";
  } else {
    status.textContent = "Game in progress";
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
  state = startGame(createGameState());
  updateInterface();
  scheduleTick();
}

primaryAction.addEventListener("click", beginGame);

window.addEventListener("keydown", (event) => {
  const direction = directionForKey(event.key);

  if (!direction) {
    return;
  }

  event.preventDefault();
  state = queueDirection(state, direction);
  updateInterface();
});

updateInterface();
