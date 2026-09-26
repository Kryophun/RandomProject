import { expect, test } from "@playwright/test";

test("starts wrap mode, moves, pauses, and resumes", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Wrap", { exact: true }).click();
  await page.getByRole("button", { name: "Start game" }).click();

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
  await page.getByRole("button", { name: "Start game" }).click();
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
  await page.getByRole("button", { name: "Start game" }).click();

  await expect(page.locator("#game-status")).toHaveText("Game over", {
    timeout: 4_000,
  });
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByText(/Walls mode - speed/)).toBeVisible();
});

test("starts a campaign with a target and obstacle layout", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Campaign", { exact: true }).click();
  await page.getByRole("button", { name: "Start game" }).click();

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
