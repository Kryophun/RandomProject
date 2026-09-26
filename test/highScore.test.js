import { describe, expect, it, vi } from "vitest";
import {
  HIGH_SCORE_KEY,
  readHighScore,
  writeHighScore,
} from "../src/storage/highScore.js";

function createStorage(value = null) {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  };
}

describe("high score storage", () => {
  it("reads a saved non-negative integer", () => {
    const storage = createStorage("12");

    expect(readHighScore(storage)).toBe(12);
    expect(storage.getItem).toHaveBeenCalledWith(HIGH_SCORE_KEY);
  });

  it.each([null, "", "fruit", "-1", "2.5"])(
    "treats %j as no saved score",
    (value) => {
      expect(readHighScore(createStorage(value))).toBe(0);
    },
  );

  it("continues when reading storage throws", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };

    expect(readHighScore(storage)).toBe(0);
  });

  it("writes a valid score", () => {
    const storage = createStorage();

    expect(writeHighScore(7, storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(HIGH_SCORE_KEY, "7");
  });

  it("rejects invalid scores and storage errors", () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };

    expect(writeHighScore(-1, storage)).toBe(false);
    expect(writeHighScore(1.5, storage)).toBe(false);
    expect(writeHighScore(1, storage)).toBe(false);
  });
});
