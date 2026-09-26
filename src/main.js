import "./styles.css";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  readUnlockedAchievements,
  writeUnlockedAchievements,
} from "./achievements/achievements.js";
import {
  advanceLevelCountdown,
  advanceCampaignLevel,
  beginLevelCountdown,
  createGameState,
  pauseGame,
  queueDirection,
  resumeGame,
  spitApple,
  stepGame,
} from "./game/engine.js";
import { getTickInterval } from "./game/speed.js";
import {
  directionForKey,
  directionForSwipe,
} from "./input/controls.js";
import { renderGame } from "./render/canvasRenderer.js";
import { readHighScore, writeHighScore } from "./storage/highScore.js";
import {
  UPGRADES,
  calculateRunUpgradePoints,
  getUpgradeEffects,
  isUpgradeAvailable,
  purchaseUpgrade,
  readUpgradeProgress,
  writeUpgradeProgress,
} from "./upgrades/upgrades.js";

const canvas = document.querySelector("#game-board");
const context = canvas.getContext("2d");
const boardWrap = document.querySelector("#board-wrap");
const score = document.querySelector("#score");
const highScoreDisplay = document.querySelector("#high-score");
const campaignProgress = document.querySelector("#campaign-progress");
const campaignLevel = document.querySelector("#campaign-level");
const debugRunBadge = document.querySelector("#debug-run-badge");
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
const campaignBossMinions = document.querySelector(
  "#campaign-boss-minions",
);
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
const upgradesPanel = document.querySelector("#upgrades-panel");
const upgradePointsDisplay = document.querySelector("#upgrade-points");
const upgradeNodeLayer = document.querySelector("#upgrade-node-layer");
const upgradeDetailIcon = document.querySelector("#upgrade-detail-icon");
const upgradeDetailTitle = document.querySelector("#upgrade-detail-title");
const upgradeDetailDescription = document.querySelector(
  "#upgrade-detail-description",
);
const upgradeDetailRequirement = document.querySelector(
  "#upgrade-detail-requirement",
);
const purchaseUpgradeButton = document.querySelector("#purchase-upgrade");
const debugPanel = document.querySelector("#debug-panel");
const debugTab = document.querySelector("#debug-tab");
const debugLevelForm = document.querySelector("#debug-level-form");
const debugLevelInput = document.querySelector("#debug-level-input");
const debugStatus = document.querySelector("#debug-status");
const secretCommandInput = document.querySelector(
  "#secret-command-input",
);
const achievementList = document.querySelector("#achievement-list");
const achievementSummary = document.querySelector("#achievement-summary");
const achievementNotification = document.querySelector(
  "#achievement-notification",
);

let state = createGameState();
let timerId = null;
let countdownTimerId = null;
let highScore = readHighScore();
let pointerStart = null;
let notificationTimerId = null;
let unlockedAchievementIds = readUnlockedAchievements();
let debugSequence = "";
let upgradeProgress = readUpgradeProgress();
let upgradeEffects = getUpgradeEffects(upgradeProgress.purchased);
let selectedUpgradeId = UPGRADES[0].id;

function stopTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function stopCountdownTimer() {
  if (countdownTimerId !== null) {
    window.clearTimeout(countdownTimerId);
    countdownTimerId = null;
  }
}

function scheduleTick() {
  stopTimer();
  const interval = Math.round(
    getTickInterval(state.score) *
      (state.upgrades?.tickIntervalMultiplier ?? 1),
  );
  timerId = window.setTimeout(runTick, interval);
}

function scheduleCountdownTick() {
  stopCountdownTimer();
  countdownTimerId = window.setTimeout(runCountdownTick, 1_000);
}

function updateHighScore() {
  if (state.debugMode || state.score <= highScore) {
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

function showNotification(text) {
  if (notificationTimerId !== null) {
    window.clearTimeout(notificationTimerId);
  }

  achievementNotification.textContent = text;
  achievementNotification.hidden = false;
  notificationTimerId = window.setTimeout(() => {
    achievementNotification.hidden = true;
    notificationTimerId = null;
  }, 4_000);
}

function showAchievementNotification(achievement) {
  showNotification(
    `${achievement.icon} Achievement unlocked: ${achievement.title}`,
  );
}

function updateAchievements() {
  if (state.debugMode) {
    return;
  }

  const result = evaluateAchievements(state, unlockedAchievementIds);

  if (result.newlyUnlocked.length === 0) {
    return;
  }

  unlockedAchievementIds = result.unlockedIds;
  writeUnlockedAchievements(unlockedAchievementIds);
  renderAchievements();
  showAchievementNotification(result.newlyUnlocked.at(-1));
}

function selectedUpgrade() {
  return UPGRADES.find((upgrade) => upgrade.id === selectedUpgradeId);
}

function renderUpgradeDetails() {
  const upgrade = selectedUpgrade();
  const purchased = upgradeProgress.purchased.includes(upgrade.id);
  const available = isUpgradeAvailable(
    upgrade,
    upgradeProgress.purchased,
  );
  const prerequisites = upgrade.prerequisites
    .map(
      (id) =>
        UPGRADES.find((candidate) => candidate.id === id)?.title,
    )
    .filter(Boolean);

  upgradeDetailIcon.textContent = upgrade.icon;
  upgradeDetailTitle.textContent = upgrade.title;
  upgradeDetailDescription.textContent = upgrade.description;
  upgradeDetailRequirement.textContent = purchased
    ? "Purchased"
    : available
      ? "Available to purchase"
      : `Requires ${prerequisites.join(" and ")}`;
  purchaseUpgradeButton.disabled =
    purchased || !available || upgradeProgress.points < upgrade.cost;
  purchaseUpgradeButton.textContent = purchased
    ? "Purchased"
    : `Purchase for ${upgrade.cost}`;
}

function renderUpgradeTree() {
  const positions = new Map([
    ["calm-roots", [50, 8]],
    ["orchard-wisdom", [30, 22]],
    ["boss-training", [70, 22]],
    ["rainbow-reservoir", [12.5, 38]],
    ["hunter-bounty", [37.5, 38]],
    ["heavy-spit", [62.5, 38]],
    ["deep-pockets", [87.5, 38]],
    ["prismatic-heart", [6.25, 55]],
    ["rainbow-windfall", [18.75, 55]],
    ["royal-bounty", [31.25, 55]],
    ["tangled-time", [43.75, 55]],
    ["siege-apples", [56.25, 55]],
    ["boss-hourglass", [68.75, 55]],
    ["loaded-vault", [81.25, 55]],
    ["endless-quiver", [93.75, 55]],
    ["eternal-rainbow", [12.5, 74]],
    ["enemy-stasis", [37.5, 74]],
    ["boss-dominator", [62.5, 74]],
    ["arsenal-overflow", [87.5, 74]],
    ["garden-ascendant", [50, 92]],
  ]);
  const nodes = UPGRADES.map((upgrade) => {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const title = document.createElement("span");
    const cost = document.createElement("span");
    const purchased = upgradeProgress.purchased.includes(upgrade.id);
    const available = isUpgradeAvailable(
      upgrade,
      upgradeProgress.purchased,
    );
    const [x, y] = positions.get(upgrade.id);

    button.type = "button";
    button.className = [
      "upgrade-node",
      purchased ? "is-purchased" : "",
      available ? "is-available" : "",
      !purchased && !available ? "is-locked" : "",
      selectedUpgradeId === upgrade.id ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.setAttribute(
      "aria-label",
      `${upgrade.title}. ${upgrade.description} Cost ${upgrade.cost}. ${
        purchased ? "Purchased." : available ? "Available." : "Locked."
      }`,
    );
    icon.className = "upgrade-node-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = upgrade.icon;
    title.className = "upgrade-node-title";
    title.textContent = upgrade.title;
    cost.className = "upgrade-node-cost";
    cost.textContent = purchased ? "Owned" : `${upgrade.cost} pts`;
    button.append(icon, title, cost);
    button.addEventListener("click", () => {
      selectedUpgradeId = upgrade.id;
      renderUpgradeTree();
    });
    return button;
  });

  upgradePointsDisplay.textContent = String(upgradeProgress.points);
  upgradeNodeLayer.replaceChildren(...nodes);
  renderUpgradeDetails();
}

function buySelectedUpgrade() {
  const upgrade = selectedUpgrade();
  const result = purchaseUpgrade(upgradeProgress, upgrade.id);

  if (!result.purchased) {
    return;
  }

  upgradeProgress = result.progress;
  upgradeEffects = getUpgradeEffects(upgradeProgress.purchased);
  state = { ...state, upgrades: upgradeEffects };
  writeUpgradeProgress(upgradeProgress);
  renderUpgradeTree();
  showNotification(`${upgrade.icon} Purchased ${upgrade.title}`);
}

function awardRunUpgradePoints() {
  if (
    state.lifecycle !== "game-over" ||
    state.upgradePointsAwarded
  ) {
    return;
  }

  const earned = calculateRunUpgradePoints(state);
  state = {
    ...state,
    upgradePointsAwarded: true,
    lastUpgradePointsEarned: earned,
  };

  if (earned <= 0) {
    return;
  }

  upgradeProgress = {
    ...upgradeProgress,
    points: upgradeProgress.points + earned,
  };
  writeUpgradeProgress(upgradeProgress);
  renderUpgradeTree();
  showNotification(`⬆️ Run complete: +${earned} upgrade points`);
}

function updateInterface() {
  awardRunUpgradePoints();
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
  canvas.dataset.debugMode = String(Boolean(state.debugMode));
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
  const isCountdown = state.lifecycle === "countdown";
  const isGameOver = state.lifecycle === "game-over";
  const isLevelComplete = state.lifecycle === "level-complete";
  const isCampaign = state.gameMode === "campaign";
  const isBossLevel = Boolean(state.bossLevel);
  overlay.hidden =
    !isReady &&
    !isPaused &&
    !isCountdown &&
    !isGameOver &&
    !isLevelComplete;
  overlay.classList.toggle("is-countdown", isCountdown);
  modeSelector.hidden = isPaused || isCountdown || isLevelComplete;
  gameModeSelector.hidden = isPaused || isCountdown || isLevelComplete;
  primaryAction.hidden = isCountdown;
  pauseAction.disabled =
    isReady || isCountdown || isGameOver || isLevelComplete;
  pauseAction.textContent = isPaused ? "Resume" : "Pause";
  campaignProgress.hidden = !isCampaign;
  campaignLevel.textContent = String(state.level);
  debugRunBadge.hidden = !state.debugMode;
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
  campaignBossMinions.textContent = String(state.enemies?.length ?? 0);
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
  } else if (isCountdown) {
    message.textContent = String(state.countdown);
    status.textContent = `Starting in ${state.countdown}`;
    canvas.setAttribute(
      "aria-label",
      `Snake board starts in ${state.countdown}.`,
    );
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
      ? `Board complete! Final score: ${state.score}. Upgrade points earned: ${state.lastUpgradePointsEarned}.`
      : `${isCampaign ? `Campaign ended on level ${state.level}. ` : ""}Final score: ${state.score}. Upgrade points earned: ${state.lastUpgradePointsEarned}.`;
    primaryAction.textContent = "Play again";
    status.textContent = state.completed ? "Board complete" : "Game over";
    canvas.setAttribute(
      "aria-label",
      `${state.completed ? "Board complete" : "Game over"} at score ${state.score}.`,
    );
  } else {
    const modeLabel = state.edgeMode === "wrap" ? "Wrap" : "Walls";
    status.textContent = isBossLevel
      ? `${state.debugMode ? "Debug " : ""}Boss Level ${state.level} - ${state.boss?.name} HP ${state.boss?.hp}/${state.boss?.maxHp} - ${state.appleAmmo} apple shots - ${state.enemies?.length ?? 0} minions`
      : isCampaign
      ? `${state.debugMode ? "Debug " : ""}Campaign level ${state.level} - ${state.applesEaten}/${state.applesRequired} apples${
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
            ? `Boss level ${state.level}. ${state.boss?.name} has ${state.boss?.hp} health. ${state.appleAmmo} apple shots and ${state.enemies?.length ?? 0} minions active.`
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

function runCountdownTick() {
  countdownTimerId = null;
  state = advanceLevelCountdown(state);
  updateInterface();

  if (state.lifecycle === "countdown") {
    scheduleCountdownTick();
  } else if (state.lifecycle === "running") {
    scheduleTick();
  }
}

function startLevelCountdown() {
  stopTimer();
  stopCountdownTimer();
  state = beginLevelCountdown(state);
  updateInterface();
  scheduleCountdownTick();
}

function beginGame() {
  stopTimer();
  stopCountdownTimer();
  const edgeMode = document.querySelector(
    'input[name="edge-mode"]:checked',
  ).value;
  const gameMode = document.querySelector(
    'input[name="game-mode"]:checked',
  ).value;
  state = createGameState({
    edgeMode,
    gameMode,
    upgrades: upgradeEffects,
  });
  startLevelCountdown();
}

function startNextCampaignLevel() {
  stopTimer();
  stopCountdownTimer();
  state = advanceCampaignLevel(state);
  startLevelCountdown();
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
  const showGame = tabName === "game";
  const showAchievements = tabName === "achievements";
  const showUpgrades = tabName === "upgrades";
  const showDebug = tabName === "debug";

  if (!showGame && state.lifecycle === "running") {
    togglePause();
  }

  if (!showGame && state.lifecycle === "countdown") {
    stopCountdownTimer();
  }

  gamePanel.hidden = !showGame;
  achievementsPanel.hidden = !showAchievements;
  upgradesPanel.hidden = !showUpgrades;
  debugPanel.hidden = !showDebug;

  tabButtons.forEach((button) => {
    button.setAttribute(
      "aria-selected",
      String(button.dataset.tab === tabName),
    );
  });

  if (
    showGame &&
    state.lifecycle === "countdown" &&
    countdownTimerId === null
  ) {
    scheduleCountdownTick();
  }
}

function unlockDebugPanel() {
  debugTab.hidden = false;
  debugStatus.textContent = "Debug tools unlocked with /rise.";
  selectTab("debug");
  debugLevelInput.focus();
}

function trackDebugSequence(event) {
  const target = event.target;
  const isEditing =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;

  if (
    isEditing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.key.length !== 1
  ) {
    return false;
  }

  const nextSequence = `${debugSequence}${event.key.toLowerCase()}`;

  if (!"/rise".startsWith(nextSequence)) {
    debugSequence = event.key === "/" ? "/" : "";
    return debugSequence === "/";
  }

  debugSequence = nextSequence;

  if (debugSequence === "/rise") {
    debugSequence = "";
    unlockDebugPanel();
  }

  return true;
}

function jumpToCampaignLevel(event) {
  event.preventDefault();
  const level = Number(debugLevelInput.value);

  if (!Number.isInteger(level) || level < 1 || level > 999) {
    debugStatus.textContent = "Enter a whole-number level from 1 to 999.";
    return;
  }

  stopTimer();
  stopCountdownTimer();
  const edgeMode = document.querySelector(
    'input[name="edge-mode"]:checked',
  ).value;
  state = createGameState({
    edgeMode,
    gameMode: "campaign",
    level,
    debugMode: true,
    upgrades: upgradeEffects,
  });
  debugStatus.textContent = `Starting debug Campaign Level ${level}.`;
  selectTab("game");
  startLevelCountdown();
}

function handleSecretCommandInput() {
  if (secretCommandInput.value.trim().toLowerCase() !== "/rise") {
    return;
  }

  secretCommandInput.value = "";
  unlockDebugPanel();
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
  if (trackDebugSequence(event)) {
    event.preventDefault();
    return;
  }

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

debugLevelForm.addEventListener("submit", jumpToCampaignLevel);
secretCommandInput.addEventListener("input", handleSecretCommandInput);
purchaseUpgradeButton.addEventListener("click", buySelectedUpgrade);

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
renderUpgradeTree();
updateInterface();
requestAnimationFrame(resizeCanvas);
