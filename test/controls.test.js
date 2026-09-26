import { describe, expect, it } from "vitest";
import {
  directionForKey,
  directionForSwipe,
} from "../src/input/controls.js";

describe("keyboard controls", () => {
  it.each([
    ["ArrowUp", "up"],
    ["s", "down"],
    ["A", "left"],
    ["d", "right"],
    ["Enter", null],
  ])("maps %s to %s", (key, expected) => {
    expect(directionForKey(key)).toBe(expected);
  });
});

describe("swipe controls", () => {
  it.each([
    [{ x: 0, y: 0 }, { x: 50, y: 5 }, "right"],
    [{ x: 50, y: 0 }, { x: 0, y: 5 }, "left"],
    [{ x: 0, y: 50 }, { x: 5, y: 0 }, "up"],
    [{ x: 0, y: 0 }, { x: 5, y: 50 }, "down"],
  ])("recognizes a clear cardinal swipe", (start, end, expected) => {
    expect(directionForSwipe(start, end)).toBe(expected);
  });

  it("ignores short and diagonal gestures", () => {
    expect(directionForSwipe({ x: 0, y: 0 }, { x: 10, y: 4 })).toBeNull();
    expect(directionForSwipe({ x: 0, y: 0 }, { x: 30, y: 30 })).toBeNull();
  });
});
