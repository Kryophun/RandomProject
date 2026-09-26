import "./styles.css";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  readUnlockedAchievements,
  writeUnlockedAchievements,
} from "./achievements/achievements.js";
import {
  advanceCampaignLevel,
  createGameState,
  pauseGame,
  queueDirection,
  resumeGame,
  spitApple,
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
const campaignApplesStatus = document.querySelector(
  "#campaign-apples-status",
);
const campaignEnemies = document.querySelector("#campaign-enemies");
const campaignEnemiesStatus = document.querySelector(
  "#campaign-enemies-status",
);
const campaignBossStatus = document.querySelector("#campaign-boss-status");
const campaignBossName = document.querySelector("#campaign-boss-name");
const campaignBossHp = document.querySelector("#campaign-boss-hp");
const campaignBossAmmo = document.querySelector("#campaign-boss-ammo");
const campaignPower = document.querySelector("#campaign-power");
const campaignPowerCount = document.querySelector("#campaign-power-count");
const overlay = document.querySelector("#game-overlay");
const message = document.querySelector("#game-message");
const modeSelector = document.querySelector("#mode-selector");
const gameModeSelector = document.querySelector("#game-mode-selector");
const primaryAction = document.querySelector("#primary-action");
const pauseAction = document.querySelector("#pause-action");
const spitAction = document.querySelector("#spit-action");
const status = document.querySelector("#game-status");
const directionButtons = document.querySelectorAll("[data-direction]");
const tabButtons = document.querySelectorAll("[data-tab]");
const gamePanel = document.querySelector("#game-panel");
const achievementsPanel = document.querySelector("#achievements-panel");
const achievementList = document.querySelector("#achievement-list");
const achievementSummary = document.querySelector("#achievement-summary");
const achievementNotification = document.querySelector(
  "#achievement-notification",
);

let state = createGameState();
let timerId = null;
let highScore = readHighScore();
let pointerStart = null;
let notificationTimerId = null;
let unlockedAchievementIds = readUnlockedAchievements();

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

function renderAchievements() {
  const unlocked = new Set(unlockedAchievementIds);
  const cards = ACHIEVEMENTS.map((achievement) => {
    const card = document.createElement("article");
    const icon = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const stateLabel = document.createElement("span");
    const isUnlocked = unlocked.has(achievement.id);

    card.className = `achievement-card${isUnlocked ? " is-unlocked" : ""}`;
    icon.className = "achievement-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = achievement.icon;
    title.textContent = achievement.title;
    description.textContent = achievement.description;
    stateLabel.className = "achievement-state";
    stateLabel.textContent = isUnlocked ? "Unlocked" : "Locked";
    content.append(title, description);
    card.append(icon, content, stateLabel);
    return card;
  });

  achievementList.replaceChildren(...cards);
  achievementSummary.textContent =
    `${unlocked.size} of ${ACHIEVEMENTS.length} unlocked`;
}

function showAchievementNotification(achievement) {
  if (notificationTimerId !== null) {
    window.clearTimeout(notificationTimerId);
  }

  achievementNotification.textContent =
    `${achievement.icon} Achievement unlocked: ${achievement.title}`;
  achievementNotification.hidden = false;
  notificationTimerId = window.setTimeout(() => {
    achievementNotification.hidden = true;
    notificationTimerId = null;
  }, 4_000);
}

function updateAchievements() {
  const result = evaluateAchievements(state, unlockedAchievementIds);

  if (result.newlyUnlocked.length === 0) {
    return;
  }

  unlockedAchievementIds = result.unlockedIds;
  writeUnlockedAchievements(unlockedAchievementIds);
  renderAchievements();
  showAchievementNotification(result.newlyUnlocked.at(-1));
}

function updateInterface() {
  updateAchievements();
  updateHighScore();
  score.textContent = String(state.score);
  highScoreDisplay.textContent = String(highScore);
  renderGame(context, state);
  canvas.dataset.lifecycle = state.lifecycle;
  canvas.dataset.edgeMode = state.edgeMode;
  canvas.dataset.gameMode = state.gameMode;
  canvas.dataset.level = String(state.level);
  canvas.dataset.wallCount = String(state.walls?.length ?? 0);
  canvas.dataset.enemyCount = String(state.enemies?.length ?? 0);
  canvas.dataset.rainbowApple = state.rainbowApple ? "present" : "eaten";
  canvas.dataset.invincibility = String(state.invincibilityTicks ?? 0);
  canvas.dataset.bossLevel = String(Boolean(state.bossLevel));
  canvas.dataset.bossHp = String(state.boss?.hp ?? 0);
  canvas.dataset.appleAmmo = String(state.appleAmmo ?? 0);
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
  const isBossLevel = Boolean(state.bossLevel);
  overlay.hidden = !isReady && !isPaused && !isGameOver && !isLevelComplete;
  modeSelector.hidden = isPaused || isLevelComplete;
  gameModeSelector.hidden = isPaused || isLevelComplete;
  pauseAction.disabled = isReady || isGameOver || isLevelComplete;
  pauseAction.textContent = isPaused ? "Resume" : "Pause";
  campaignProgress.hidden = !isCampaign;
  campaignLevel.textContent = String(state.level);
  campaignApples.textContent = `${state.applesEaten} / ${state.applesRequired}`;
  campaignEnemies.textContent =
    `${state.enemies?.length ?? 0} active / ` +
    `${state.enemiesDefeated ?? 0} defeated`;
  campaignPower.hidden = (state.invincibilityTicks ?? 0) <= 0;
  campaignPowerCount.textContent =
    `${state.invincibilityTicks ?? 0} moves`;
  campaignApplesStatus.hidden = isBossLevel;
  campaignEnemiesStatus.hidden = isBossLevel;
  campaignBossStatus.hidden = !isBossLevel;
  campaignBossName.textContent = state.boss?.name ?? "Defeated";
  campaignBossHp.textContent =
    `${Math.max(0, state.boss?.hp ?? 0)} / ${state.boss?.maxHp ?? 3}`;
  campaignBossAmmo.textContent = String(state.appleAmmo ?? 0);
  spitAction.hidden = !isBossLevel;
  spitAction.disabled =
    !isBossLevel ||
    state.lifecycle !== "running" ||
    (state.appleAmmo ?? 0) <= 0;
  spitAction.textContent = `Spit apple (F) - ${state.appleAmmo ?? 0}`;

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
    message.textContent = isBossLevel
      ? `${state.boss?.name ?? "Boss"} defeated!`
      : `Level ${state.level} complete! ${state.applesEaten} apples eaten.`;
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
    status.textContent = isBossLevel
      ? `Boss Level ${state.level} - ${state.boss?.name} HP ${state.boss?.hp}/3 - ${state.appleAmmo} apple shots`
      : isCampaign
      ? `Campaign level ${state.level} - ${state.applesEaten}/${state.applesRequired} apples${
          state.invincibilityTicks > 0
            ? ` - invincible for ${state.invincibilityTicks} moves`
            : ""
        }`
      : `${modeLabel} mode - speed ${state.speedTier + 1}`;
    canvas.setAttribute(
      "aria-label",
      `Snake board in progress. Score ${state.score}. ${
        isCampaign
          ? isBossLevel
            ? `Boss level ${state.level}. ${state.boss?.name} has ${state.boss?.hp} health. ${state.appleAmmo} apple shots available.`
            : `Campaign level ${state.level}, ${state.applesEaten} of ${state.applesRequired} apples, ${state.enemies?.length ?? 0} enemies active.${
              state.invincibilityTicks > 0
                ? ` Invincible for ${state.invincibilityTicks} moves.`
                : ""
            }`
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

function fireApple() {
  const nextState = spitApple(state);

  if (nextState === state) {
    return;
  }

  state = nextState;

  if (state.lifecycle === "level-complete") {
    stopTimer();
  }

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

function selectTab(tabName) {
  if (tabName === "achievements" && state.lifecycle === "running") {
    togglePause();
  }

  const showGame = tabName === "game";
  gamePanel.hidden = !showGame;
  achievementsPanel.hidden = showGame;

  tabButtons.forEach((button) => {
    button.setAttribute(
      "aria-selected",
      String(button.dataset.tab === tabName),
    );
  });
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
spitAction.addEventListener("click", fireApple);

window.addEventListener("keydown", (event) => {
  if (gamePanel.hidden) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.key === "Enter" || event.key === "f" || event.key === "F") {
    event.preventDefault();
    fireApple();
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

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectTab(button.dataset.tab);
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

renderAchievements();
updateInterface();
requestAnimationFrame(resizeCanvas);
