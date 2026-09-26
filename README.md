# Garden Snake

A small browser-based Snake game built with plain HTML, CSS, and JavaScript. It
uses an HTML canvas for the board and original styling inspired by clean,
grid-based Snake games.

## Features

- Fruit, growth, scoring, wall collisions, and self-collisions
- Walls and edge-wrapping modes selectable before each game
- Progressive campaign mode with apple targets and obstacle layouts
- Increasing speed as the score grows
- Pause and resume
- Locally saved high score
- Arrow-key, WASD, swipe, and on-screen direction controls
- Responsive, high-density canvas rendering

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite.

## Controls

- **Turn:** Arrow keys, WASD, swipe across the board, or use the direction
  buttons
- **Pause or resume:** Space or the Pause/Resume button
- **Restart:** Use Play again after the game ends

The snake cannot reverse directly into its own neck.

## Game modes

- **Classic:** Keep eating and growing until the snake collides.
- **Campaign:** Complete each level by eating its required apples. Every new
  level requires more apples and adds more stone walls. Obstacle layouts are
  different for each level while keeping all open board cells connected.
- **Walls:** Crossing a board edge ends the game.
- **Wrap:** Crossing an edge continues from the opposite side.

Choose the mode before starting. The selected rule remains active for that
game.

## Validation

```powershell
npm test
npm run test:e2e
npm run build
```

Unit tests cover the deterministic game rules, speed progression, controls, and
high-score storage. Playwright tests exercise the connected browser workflow in
Chromium.

## Production build

```powershell
npm run build
```

The generated `dist` directory contains static files that can be served by any
static web host.
