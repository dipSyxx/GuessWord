(function () {
  const GAME2048_DEFAULT_SIZE = 4;
  const GAME2048_MAX_UNDO = 20;
  const GAME2048_STATE_KEY = "arcade2048State";
  const GAME2048_BEST_KEY = "arcade2048Best";
  const GAME2048_THEME_KEY = "arcade2048Theme";
  const GAME2048_DEFAULT_THEME = "neon";
  const KEY_DIRECTION_MAP = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  const state = {
    size: GAME2048_DEFAULT_SIZE,
    board: [],
    score: 0,
    best: 0,
    hasWon: false,
    keepPlaying: false,
    isGameOver: false,
    undoStack: [],
    lastSpawnCells: [],
  };

  let pendingSavedState = null;
  let initialized = false;
  let isActive = false;
  let swipeStartPoint = null;

  let gameView;
  let boardEl;
  let scoreEl;
  let bestEl;
  let sizeSelect;
  let themeSelect;
  let newBtn;
  let undoBtn;
  let overlayEl;
  let statusTitleEl;
  let statusDetailEl;
  let keepPlayingBtn;
  let restartBtn;
  let messageEl;
  let arrowButtons;

  function cacheDom() {
    gameView = document.getElementById("game2048View");
    boardEl = document.getElementById("board2048");
    scoreEl = document.getElementById("game2048Score");
    bestEl = document.getElementById("game2048Best");
    sizeSelect = document.getElementById("game2048Size");
    themeSelect = document.getElementById("game2048Theme");
    newBtn = document.getElementById("game2048New");
    undoBtn = document.getElementById("game2048Undo");
    overlayEl = document.getElementById("game2048Overlay");
    statusTitleEl = document.getElementById("game2048Status");
    statusDetailEl = document.getElementById("game2048StatusDetail");
    keepPlayingBtn = document.getElementById("game2048KeepPlaying");
    restartBtn = document.getElementById("game2048Restart");
    messageEl = document.getElementById("game2048Message");
    arrowButtons = document.querySelectorAll("[data-game2048-move]");
  }

  function setMessage(text, type = "") {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "message message-2048";
    if (type) {
      messageEl.classList.add(type);
    }
  }

  function applyTheme(theme) {
    const choice = theme || GAME2048_DEFAULT_THEME;
    document.body.dataset.arcadeTheme = choice;
    if (themeSelect) {
      themeSelect.value = choice;
    }
    localStorage.setItem(GAME2048_THEME_KEY, choice);
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function createEmptyBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function getEmptyCells(board) {
    const cells = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === 0) {
          cells.push({ r, c });
        }
      }
    }
    return cells;
  }

  function addRandomTile(board) {
    const empty = getEmptyCells(board);
    if (!empty.length) return null;
    const spot = empty[Math.floor(Math.random() * empty.length)];
    board[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
    return spot;
  }

  function collapseLine(values) {
    const filtered = values.filter((v) => v !== 0);
    const merged = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        const val = filtered[i] * 2;
        merged.push(val);
        gained += val;
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while (merged.length < values.length) {
      merged.push(0);
    }
    return { line: merged, gained };
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function slideRow(row, reverse = false) {
    const working = reverse ? row.slice().reverse() : row.slice();
    const { line, gained } = collapseLine(working);
    const finalLine = reverse ? line.slice().reverse() : line;
    const moved = !arraysEqual(row, finalLine);
    return { line: finalLine, gained, moved };
  }

  function moveBoard(direction) {
    const size = state.size;
    let moved = false;
    let gainedTotal = 0;
    const board = state.board;

    if (direction === "left" || direction === "right") {
      const reverse = direction === "right";
      for (let r = 0; r < size; r++) {
        const row = board[r];
        const result = slideRow(row, reverse);
        if (result.moved) {
          board[r] = result.line;
          moved = true;
        }
        gainedTotal += result.gained;
      }
    } else {
      const reverse = direction === "down";
      for (let c = 0; c < size; c++) {
        const column = [];
        for (let r = 0; r < size; r++) {
          column.push(board[r][c]);
        }
        const result = slideRow(column, reverse);
        if (result.moved) {
          moved = true;
        }
        for (let r = 0; r < size; r++) {
          board[r][c] = result.line[r];
        }
        gainedTotal += result.gained;
      }
    }

    return { moved, gained: gainedTotal };
  }

  function boardHasTarget(board, target = 2048) {
    for (const row of board) {
      if (row.some((value) => value >= target)) {
        return true;
      }
    }
    return false;
  }

  function canMove(board) {
    const size = board.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = board[r][c];
        if (value === 0) return true;
        if (c + 1 < size && board[r][c + 1] === value) return true;
        if (r + 1 < size && board[r + 1][c] === value) return true;
      }
    }
    return false;
  }

  function snapshotState() {
    return {
      board: cloneBoard(state.board),
      score: state.score,
      hasWon: state.hasWon,
      keepPlaying: state.keepPlaying,
      isGameOver: state.isGameOver,
    };
  }

  function pushUndo(snapshot) {
    state.undoStack.push(snapshot);
    if (state.undoStack.length > GAME2048_MAX_UNDO) {
      state.undoStack.shift();
    }
  }

  function updateUndoButton() {
    if (!undoBtn) return;
    undoBtn.disabled = state.undoStack.length === 0;
  }

  function updateBestScore() {
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(GAME2048_BEST_KEY, String(state.best));
    }
  }

  function updateOverlay() {
    if (!overlayEl) return;
    const showWin = state.hasWon && !state.keepPlaying;
    const showLose = state.isGameOver;
    if (showWin || showLose) {
      overlayEl.classList.remove("hidden");
      if (showWin) {
        statusTitleEl.textContent = "You win!";
        statusDetailEl.textContent =
          "You reached 2048. Keep going or start fresh for a new record.";
        keepPlayingBtn.classList.remove("hidden");
      } else {
        statusTitleEl.textContent = "Game over";
        statusDetailEl.textContent =
          "No moves left. Start a new puzzle to keep the streak alive.";
        keepPlayingBtn.classList.add("hidden");
      }
    } else {
      overlayEl.classList.add("hidden");
    }
  }

  function triggerBoardPulse() {
    if (!boardEl) return;
    boardEl.classList.remove("board-2048--pulse");
    void boardEl.offsetWidth;
    boardEl.classList.add("board-2048--pulse");
  }

  function renderBoard() {
    if (!boardEl) return;
    const size = state.size;
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    const gap = size >= 6 ? "8px" : size === 5 ? "10px" : "12px";
    boardEl.style.setProperty("--arcade-2048-gap", gap);
    boardEl.style.minHeight = `${size * 90}px`;

    const spawnSet = new Set(
      (state.lastSpawnCells || [])
        .filter(Boolean)
        .map((cell) => `${cell.r}-${cell.c}`)
    );

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = state.board[r][c];
        const tile = document.createElement("div");
        tile.className = "tile-2048";
        if (value === 0) {
          tile.classList.add("tile-2048--empty");
        } else {
          const key = value <= 2048 ? value : "super";
          tile.classList.add(`tile-2048--${key}`);
          if (value >= 1024 && value < 8192) {
            tile.classList.add("tile-2048--sm");
          } else if (value >= 8192) {
            tile.classList.add("tile-2048--xs");
          }
          tile.textContent = value;
          tile.dataset.value = value;
          if (spawnSet.has(`${r}-${c}`)) {
            tile.classList.add("tile-2048--spawn");
          }
        }
        boardEl.appendChild(tile);
      }
    }

    if (spawnSet.size) {
      requestAnimationFrame(() => {
        state.lastSpawnCells = [];
      });
    }
  }

  function updateUI() {
    renderBoard();
    if (scoreEl) {
      scoreEl.textContent = state.score;
    }
    if (bestEl) {
      bestEl.textContent = state.best;
    }
    if (sizeSelect) {
      sizeSelect.value = String(state.size);
    }
    updateUndoButton();
    updateOverlay();
  }

  function saveState() {
    const data = {
      size: state.size,
      board: state.board,
      score: state.score,
      hasWon: state.hasWon,
      keepPlaying: state.keepPlaying,
      isGameOver: state.isGameOver,
    };
    localStorage.setItem(GAME2048_STATE_KEY, JSON.stringify(data));
  }

  function restoreState(data) {
    state.size = data.size || GAME2048_DEFAULT_SIZE;
    state.board =
      Array.isArray(data.board) && data.board.length
        ? data.board.map((row) => row.slice())
        : createEmptyBoard(state.size);
    state.score = data.score || 0;
    state.hasWon = Boolean(data.hasWon);
    state.keepPlaying = Boolean(data.keepPlaying);
    state.isGameOver = Boolean(data.isGameOver);
    state.undoStack = [];
    state.lastSpawnCells = [];
  }

  function startNewGame(size = GAME2048_DEFAULT_SIZE) {
    state.size = size;
    state.board = createEmptyBoard(size);
    state.score = 0;
    state.hasWon = false;
    state.keepPlaying = false;
    state.isGameOver = false;
    state.undoStack = [];
    const spawnA = addRandomTile(state.board);
    const spawnB = addRandomTile(state.board);
    state.lastSpawnCells = [spawnA, spawnB].filter(Boolean);
    updateUI();
    setMessage(`New ${size}×${size} game ready. Merge tiles to reach 2048!`);
    saveState();
  }

  function handleMove(direction) {
    if (!direction || !isActive) return;
    if (state.isGameOver) return;
    if (state.hasWon && !state.keepPlaying) return;

    const { moved, gained } = (() => {
      const snapshot = snapshotState();
      const result = moveBoard(direction);
      if (result.moved) {
        pushUndo(snapshot);
      }
      return result;
    })();

    if (!moved) {
      setMessage("No tiles moved in that direction.", "error");
      return;
    }

    if (gained > 0) {
      state.score += gained;
      triggerBoardPulse();
    }
    updateBestScore();

    if (!state.hasWon && boardHasTarget(state.board)) {
      state.hasWon = true;
      state.keepPlaying = false;
    }

    const spawn = addRandomTile(state.board);
    state.lastSpawnCells = spawn ? [spawn] : [];
    state.isGameOver = !canMove(state.board);

    const prettyDir = direction.charAt(0).toUpperCase() + direction.slice(1);
    if (gained > 0) {
      setMessage(`Merged for +${gained} (${prettyDir}).`, "success");
    } else {
      setMessage(`${prettyDir} move executed.`);
    }

    updateUI();
    saveState();
  }

  function undoMove() {
    if (!state.undoStack.length) return;
    const previous = state.undoStack.pop();
    state.board = previous.board;
    state.score = previous.score;
    state.hasWon = previous.hasWon;
    state.keepPlaying = previous.keepPlaying;
    state.isGameOver = previous.isGameOver;
    updateUI();
    setMessage("Undid your last move.");
    saveState();
  }

  function handleNewGameRequest() {
    const flat = state.board.flat();
    const hasProgress = flat.some((value) => value !== 0);
    if (!hasProgress) {
      startNewGame(state.size);
      return;
    }
    if (window.confirm("Start a new 2048 game? Current progress will be lost.")) {
      const nextSize = sizeSelect ? parseInt(sizeSelect.value, 10) : state.size;
      startNewGame(nextSize);
    }
  }

  function handleSizeChange(e) {
    const newSize = parseInt(e.target.value, 10);
    startNewGame(newSize);
  }

  function handleThemeChange(e) {
    applyTheme(e.target.value);
  }

  function keepPlaying() {
    state.keepPlaying = true;
    updateUI();
    saveState();
  }

  function restartFromOverlay() {
    startNewGame(state.size);
  }

  function handlePointerDown(event) {
    if (!isActive) return;
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    if (!boardEl.contains(event.target)) return;
    swipeStartPoint = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event) {
    if (!swipeStartPoint) return;
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      swipeStartPoint = null;
      return;
    }
    const deltaX = event.clientX - swipeStartPoint.x;
    const deltaY = event.clientY - swipeStartPoint.y;
    swipeStartPoint = null;
    const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    if (distance < 30) return;
    const direction =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
        ? "down"
        : "up";
    handleMove(direction);
  }

  function handleKeydown(event) {
    if (!isActive) return;
    const direction = KEY_DIRECTION_MAP[event.key];
    if (!direction) return;
    event.preventDefault();
    handleMove(direction);
  }

  function bootstrap() {
    const storedBest = parseInt(localStorage.getItem(GAME2048_BEST_KEY), 10);
    if (!Number.isNaN(storedBest)) {
      state.best = storedBest;
    }
    const storedTheme =
      localStorage.getItem(GAME2048_THEME_KEY) || GAME2048_DEFAULT_THEME;
    applyTheme(storedTheme);

    const saved = (() => {
      try {
        const raw = localStorage.getItem(GAME2048_STATE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.error("Failed to parse saved 2048 game", err);
        return null;
      }
    })();

    pendingSavedState = saved && saved.board ? saved : null;
  }

  function ensureInitialized() {
    if (initialized) return;
    initialized = true;
    if (pendingSavedState && pendingSavedState.board) {
      const shouldContinue = window.confirm("Continue your previous 2048 game?");
      if (shouldContinue) {
        restoreState(pendingSavedState);
        pendingSavedState = null;
        setMessage("Continuing your saved puzzle. Good luck!");
        updateUI();
        saveState();
        return;
      }
      pendingSavedState = null;
    }
    startNewGame(state.size);
  }

  function activate() {
    isActive = true;
    ensureInitialized();
  }

  function deactivate() {
    isActive = false;
  }

  function init() {
    cacheDom();
    if (!boardEl) {
      return { activate: () => {}, deactivate: () => {} };
    }

    if (newBtn) newBtn.addEventListener("click", handleNewGameRequest);
    if (undoBtn) undoBtn.addEventListener("click", undoMove);
    if (sizeSelect) sizeSelect.addEventListener("change", handleSizeChange);
    if (themeSelect) themeSelect.addEventListener("change", handleThemeChange);
    if (keepPlayingBtn) keepPlayingBtn.addEventListener("click", keepPlaying);
    if (restartBtn) restartBtn.addEventListener("click", restartFromOverlay);
    if (arrowButtons && arrowButtons.length) {
      arrowButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const direction = btn.dataset.game2048Move;
          if (direction) {
            handleMove(direction);
            btn.blur();
          }
        });
      });
    }

    if (gameView) {
      gameView.addEventListener("pointerdown", handlePointerDown);
      gameView.addEventListener("pointerup", handlePointerUp);
    }
    window.addEventListener("keydown", handleKeydown);

    bootstrap();

    return { activate, deactivate };
  }

  window.Arcade2048Game = { init };
})();
