# Mini Arcade

Mini Arcade is a single-page web playground that bundles multiple casual games in one polished experience. The project currently ships with three modes—**Guess Word**, **2048**, and **Stack Tower**—sharing the same launcher, styling system, and responsive layout.

---

## Features

- **Unified launcher:** Choose any game directly from the landing menu. Each mode shares mobile-friendly layouts, animated feedback, and persistent settings where it makes sense.
- **Guess Word**
  - 4/5/6-letter layouts with configurable secret words.
  - Animated board tiles, inline validation, and celebratory confetti on success.
- **2048**
  - Variable board sizes (4×4, 5×5, 6×6), undo stack, keyboard + swipe controls.
  - Light/Dark/Neon themes backed by CSS variables and stored in `localStorage`.
  - State persistence (board, score, best score) with an optional “continue game” prompt.
  - Merge and spawn animations to keep gameplay lively.
- **Stack Tower**
  - Canvas-based tower building with moving platforms, difficulty presets, and overlap-based trimming.
  - Falling debris animations, touch/click/keyboard controls, and best-score persistence.
- **Mobile-friendly:** Sticky Guess input bar, swipe detection for 2048, tap-to-place controls for Stack Tower, and adaptive spacing from desktop down to small phones.

---

## Tech Stack

- **HTML** (`index.html`): Hosts the launcher plus each game’s markup/hooks.
- **CSS**
  - `styles-base.css` – shared layout and theme tokens.
  - `guess-game.css`, `game2048.css`, `stacker.css` – per-game styling and animations.
- **JavaScript**
  - `guess-game.js`, `game2048.js`, `stacker.js` – logic for each game.
  - `main.js` – view switching and module activation.

There are no build tools required—everything runs directly in the browser.

---

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
3. Pick a game from the menu and start playing.

> **Tip:** For local development with live reload, you can serve the folder with any static server (e.g., `npx serve .`), but it’s optional.

---

## Controls

### Guess Word
- Type guesses using the keyboard.
- Press **Enter** or click **Guess** to submit.
- Change word length via the control panel and set a new secret word by pressing **Play**.

### 2048
- **Desktop:** Use arrow keys or WASD to move tiles.
- **Mobile:** Swipe anywhere on the board.
- **Buttons:** `New Game`, `Undo`, size selector, and theme selector are available above the board.

### Stack Tower
- **Desktop:** Press **Space** or **Enter**, or click on the canvas to place the moving block.
- **Mobile:** Tap anywhere on the stage.
- Use the difficulty dropdown and `New Game` button to restart quickly.

---

## Persistence & Settings

The app stores the following in `localStorage`:
- 2048 best score, board state, score, win/lose flags, and theme choice.
- Stack Tower best score.

Guess Word does not persist state between sessions (by design), keeping matches quick and fresh.

---

## Roadmap Ideas

- Implement additional 2048 “hard mode” variants (extra tiles, dual spawns, etc.).
- Add more arcade titles to the menu (e.g., Minesweeper, Snake).
- Expand Guess Word with dictionaries or random-word generation.

---

## License

This project is released without a specific license. Feel free to explore, tweak, and expand it for personal use. If you plan to redistribute or commercialize it, please add the appropriate license and attribution.

Enjoy the games! 🎮
