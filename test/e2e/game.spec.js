import { expect, test } from "@playwright/test";

async function startGameAndWait(page, buttonName = "Start game") {
  await page.getByRole("button", { name: buttonName }).click();
  await expect(page.locator("#game-status")).toHaveText(
    /Starting in [123]/,
  );
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-lifecycle",
    "running",
    { timeout: 4_500 },
  );
}

test("starts wrap mode, moves, pauses, and resumes", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Wrap", { exact: true }).click();
  await page.getByRole("button", { name: "Start game" }).click();

  await expect(page.locator("#game-status")).toHaveText("Starting in 3");
  const countdownHead = await page
    .locator("#game-board")
    .getAttribute("data-head");
  await page.waitForTimeout(1_100);
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-head",
    countdownHead,
  );
  await expect(page.locator("#game-status")).toHaveText("Starting in 2");
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-lifecycle",
    "running",
    { timeout: 3_000 },
  );
  await expect(page.getByText(/Wrap mode - speed/)).toBeVisible();
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-edge-mode",
    "wrap",
  );

  const startingHead = await page.locator("#game-board").getAttribute("data-head");
  await expect(page.locator("#game-board")).not.toHaveAttribute(
    "data-head",
    startingHead,
    { timeout: 1_000 },
  );

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.locator("#game-status")).toHaveText("Game paused");
  const pausedHead = await page.locator("#game-board").getAttribute("data-head");
  await page.waitForTimeout(350);
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-head",
    pausedHead,
  );

  await page.locator("#pause-action").click();
  await expect(page.locator("#game-board")).not.toHaveAttribute(
    "data-head",
    pausedHead,
    { timeout: 1_000 },
  );
});

test("supports on-screen direction controls and a saved high score", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("garden-snake-high-score", "12");
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  await expect(page.getByLabel("High score")).toContainText("12");
  await startGameAndWait(page);
  await page.getByRole("button", { name: "Turn up" }).click();
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-direction",
    "up",
    { timeout: 1_000 },
  );

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(390);
});

test("ends a walls game and restarts from the overlay", async ({ page }) => {
  await page.goto("/");
  await startGameAndWait(page);

  await expect(page.locator("#game-status")).toHaveText("Game over", {
    timeout: 4_000,
  });
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  await startGameAndWait(page, "Play again");
  await expect(page.getByText(/Walls mode - speed/)).toBeVisible();
});

test("starts a campaign with a target and obstacle layout", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Campaign", { exact: true }).click();
  await startGameAndWait(page);

  await expect(page.locator("#campaign-progress")).toContainText("Level 1");
  await expect(page.locator("#campaign-progress")).toContainText("0 / 3");
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-game-mode",
    "campaign",
  );

  const wallCount = Number(
    await page.locator("#game-board").getAttribute("data-wall-count"),
  );
  expect(wallCount).toBeGreaterThan(0);
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-enemy-count",
    "1",
  );
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-rainbow-apple",
    "present",
  );
});

test("shows persistent achievement icons and descriptions", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "garden-snake-achievements",
      JSON.stringify(["first-bite"]),
    );
  });
  await page.reload();
  await page.getByRole("tab", { name: "Achievements" }).click();

  await expect(page.getByRole("heading", { name: "Achievements" })).toBeVisible();
  await expect(page.locator("#achievement-summary")).toHaveText(
    "1 of 7 unlocked",
  );

  const unlockedCard = page
    .locator(".achievement-card")
    .filter({ hasText: "First Bite" });
  await expect(unlockedCard).toContainText("Eat your first apple.");
  await expect(unlockedCard).toContainText("Unlocked");

  const lockedCard = page
    .locator(".achievement-card")
    .filter({ hasText: "Campaign Champion" });
  await expect(lockedCard).toContainText("Reach Level 5 in Campaign mode.");
  await expect(lockedCard).toContainText("Locked");
});

test("purchases the root upgrade and unlocks two branches", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "garden-snake-upgrades",
      JSON.stringify({ points: 50, purchased: [] }),
    );
  });
  await page.reload();
  await page.getByRole("tab", { name: "Upgrades" }).click();

  await expect(page.locator(".upgrade-node")).toHaveCount(20);
  await expect(page.getByLabel("Available upgrade points")).toContainText(
    "50",
  );
  await expect(
    page.getByRole("button", { name: /Calm Roots.*Available/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Purchase for 10" }).click();

  await expect(page.getByLabel("Available upgrade points")).toContainText(
    "40",
  );
  await expect(
    page.getByRole("button", { name: /Calm Roots.*Purchased/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Orchard Wisdom.*Available/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Boss Training.*Available/ }),
  ).toBeVisible();
});

test("unlocks /rise and jumps to a debug campaign level", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Debug" })).toBeHidden();

  await page.keyboard.type("/rise");
  await expect(page.getByRole("tab", { name: "Debug" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Debug" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByLabel("Campaign level").fill("5");
  await page.getByRole("button", { name: "Jump to level" }).click();

  await expect(page.locator("#game-status")).toHaveText("Starting in 3");
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-level",
    "5",
  );
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-game-mode",
    "campaign",
  );
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-debug-mode",
    "true",
  );
  await expect(page.locator("#game-board")).toHaveAttribute(
    "data-boss-level",
    "true",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("garden-snake-achievements"),
    ),
  ).toBeNull();
});

test("accepts /rise in the hidden bottom-left command box", async ({
  page,
}) => {
  await page.goto("/");
  const commandInput = page.getByLabel("Command");

  await expect(commandInput).toHaveCSS("opacity", "0.12");
  await commandInput.fill("/rise");

  await expect(page.getByRole("tab", { name: "Debug" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Debug" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("Campaign level")).toBeFocused();
});

test("adds persistent upgrade points from the debug menu", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Command").fill("/rise");
  await page.getByLabel("Points to add").fill("250");
  await page.getByRole("button", { name: "Add points" }).click();

  await expect(page.locator("#debug-points-status")).toHaveText(
    "Added 250 upgrade points.",
  );
  await page.getByRole("tab", { name: "Upgrades" }).click();
  await expect(page.getByLabel("Available upgrade points")).toContainText(
    "250",
  );

  await page.reload();
  await page.getByRole("tab", { name: "Upgrades" }).click();
  await expect(page.getByLabel("Available upgrade points")).toContainText(
    "250",
  );
});
