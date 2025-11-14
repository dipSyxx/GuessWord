# Mini Arcade

Mini Arcade is a single-page web playground that bundles multiple casual games in one polished experience. The project currently ships with two modes—**Guess Word** (a Wordle-style duel) and a fully playable **2048** clone—sharing the same menu, theme system, and responsive design.

---

## Features

- **Unified launcher:** Choose between Guess Word and 2048 directly from the landing menu. Both games share common styling, mobile-friendly layouts, and back-to-menu controls.
- **Guess Word**
  - 4/5/6-letter layouts with configurable secret words.
  - Animated board tiles, inline validation messages, and celebratory confetti on success.
- **2048**
  - Variable board sizes (4×4, 5×5, 6×6), undo stack, keyboard + swipe controls.
  - Light/Dark/Neon themes backed by CSS variables and stored in `localStorage`.
  - State persistence (board, score, best score) with an optional “continue game” prompt.
  - Merge and spawn animations to keep gameplay lively.
- **Mobile-friendly:** Sticky Guess input bar, swipe detection for 2048, and adaptive spacing from desktop down to small phones.

---

## Tech Stack

- **HTML** (`index.html`): Contains the menu, Guess Word UI, and 2048 interface.
- **CSS** (`styles.css`): Provides the visual system (themes, layout, animations).
- **JavaScript** (`app.js`): Implements both games, shared state management, localStorage persistence, and input handling.

There are no build tools required—everything runs in the browser.

---

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
3. Choose a game from the menu and start playing.

> **Tip:** For local development with live reload, you can serve the folder with any static server (e.g., `npx serve .`) but it’s optional.

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

---

## Persistence & Settings

The app stores the following in `localStorage`:
- 2048 best score.
- 2048 current board, score, win/lose flags.
- Selected 2048 theme.

Guess Word does not persist state between sessions (by design), keeping matches quick and fresh.

---

## Roadmap Ideas

- Implement the actual 2048 “hard mode” variants (extra tiles, dual spawns, etc.).
- Add more arcade titles to the menu (e.g., Minesweeper, Snake).
- Expand Guess Word with dictionaries or random-word generation.

---

## License

This project is released without a specific license. Feel free to explore, tweak, and expand it for personal use. If you plan to redistribute or commercialize it, please add the appropriate license and attribution.

Enjoy the games! 🎮
