      const MAX_ATTEMPTS = 6;

      const wordLengthSelect = document.getElementById("wordLength");
      const secretInput = document.getElementById("secretInput");
      const startBtn = document.getElementById("startBtn");

      const boardEl = document.getElementById("board");
      const guessInput = document.getElementById("guessInput");
      const guessBtn = document.getElementById("guessBtn");
      const messageEl = document.getElementById("message");
      const menuView = document.getElementById("menuView");
      const guessView = document.getElementById("guessView");
      const game2048View = document.getElementById("game2048View");
      const playButtons = document.querySelectorAll("[data-play-game]");
      const backButtons = document.querySelectorAll("[data-back-to-menu]");

      const board2048El = document.getElementById("board2048");
      const game2048ScoreEl = document.getElementById("game2048Score");
      const game2048BestEl = document.getElementById("game2048Best");
      const game2048SizeSelect = document.getElementById("game2048Size");
      const game2048ThemeSelect = document.getElementById("game2048Theme");
      const game2048NewBtn = document.getElementById("game2048New");
      const game2048UndoBtn = document.getElementById("game2048Undo");
      const game2048Overlay = document.getElementById("game2048Overlay");
      const game2048Status = document.getElementById("game2048Status");
      const game2048StatusDetail = document.getElementById("game2048StatusDetail");
      const game2048KeepPlayingBtn = document.getElementById("game2048KeepPlaying");
      const game2048RestartBtn = document.getElementById("game2048Restart");
      const game2048MessageEl = document.getElementById("game2048Message");

      let secretWord = "";
      let wordLength = 5;
      let currentAttempt = 0;
      let gameOver = false;

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

      const game2048State = {
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

      const views = {
        menu: menuView,
        guess: guessView,
        game2048: game2048View,
      };
      let activeView = "menu";
      let swipeStartPoint = null;

      function rebuildBoardForLength(length) {
        wordLength = length;
        createBoard();
        guessInput.value = "";
        guessInput.maxLength = wordLength;
      }

      function showView(name) {
        Object.values(views).forEach((view) => {
          view.classList.add("hidden");
        });
        const target = views[name];
        if (target) {
          target.classList.remove("hidden");
        }
        activeView = name;
        if (name === "guess") {
          guessInput.focus();
        }
      }

      function launchConfetti(pieceCount = 70) {
        const container = document.createElement("div");
        container.className = "confetti-container";
        document.body.appendChild(container);

        const colors = ["#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#f1c40f", "#3498db"];
        let longestLifetime = 0;

        for (let i = 0; i < pieceCount; i++) {
          const piece = document.createElement("span");
          piece.className = "confetti-piece";

          const size = 6 + Math.random() * 6;
          piece.style.width = `${size}px`;
          piece.style.height = `${size * 1.6}px`;
          piece.style.left = `${Math.random() * 100}%`;
          piece.style.background = colors[Math.floor(Math.random() * colors.length)];

          const duration = 2 + Math.random() * 1.5;
          const delay = Math.random() * 0.4;
          piece.style.setProperty("--duration", `${duration}s`);
          piece.style.setProperty("--delay", `${delay}s`);
          piece.style.setProperty("--drift", `${Math.random() * 60 - 30}vw`);
          piece.style.setProperty("--rotate", `${360 + Math.random() * 360}deg`);

          longestLifetime = Math.max(longestLifetime, duration + delay);
          container.appendChild(piece);
        }

        setTimeout(() => {
          container.remove();
        }, longestLifetime * 1000 + 400);
      }

      function showMessage(text, type = "") {
        messageEl.textContent = text;
        messageEl.className = "message";
        if (type) messageEl.classList.add(type);
      }

      function createBoard() {
        boardEl.innerHTML = "";
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          const row = document.createElement("div");
          row.className = "row";
          row.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;
          for (let j = 0; j < wordLength; j++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            row.appendChild(tile);
          }
          boardEl.appendChild(row);
        }
      }

      function startGame() {
        const selectedLength = parseInt(wordLengthSelect.value, 10);
        let rawSecret = secretInput.value.trim().toUpperCase();

        if (!rawSecret) {
          showMessage("Enter the word you want to set as secret.", "error");
          return;
        }

        if (!/^[A-Z]+$/.test(rawSecret)) {
          showMessage(
            "The word must contain only English letters A–Z.",
            "error"
          );
          return;
        }

        if (rawSecret.length !== selectedLength) {
          showMessage(
            `The word must be exactly ${selectedLength} letters long.`,
            "error"
          );
          return;
        }

        secretWord = rawSecret;
        currentAttempt = 0;
        gameOver = false;

        rebuildBoardForLength(selectedLength);
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessInput.focus();
        showMessage(
          `Game started! Guess a ${wordLength}-letter word in ${MAX_ATTEMPTS} attempts.`,
          ""
        );
      }

      function evaluateGuess(guess, secret) {
        const len = secret.length;
        const result = new Array(len).fill("miss");

        const secretChars = secret.split("");
        const used = new Array(len).fill(false);

        // First, exact matches (green)
        for (let i = 0; i < len; i++) {
          if (guess[i] === secret[i]) {
            result[i] = "correct";
            used[i] = true;
          }
        }

        // Then, letters that exist in the word but are in a different position (yellow)
        for (let i = 0; i < len; i++) {
          if (result[i] === "correct") continue;
          const ch = guess[i];

          for (let j = 0; j < len; j++) {
            if (!used[j] && secretChars[j] === ch) {
              result[i] = "present";
              used[j] = true;
              break;
            }
          }
        }

        return result;
      }

      function handleGuess() {
        if (gameOver) return;

        const rawGuess = guessInput.value.trim().toUpperCase();
        if (rawGuess.length !== wordLength) {
          showMessage(
            `Your guess must be exactly ${wordLength} letters long.`,
            "error"
          );
          return;
        }
        if (!/^[A-Z]+$/.test(rawGuess)) {
          showMessage("Use only English letters A–Z.", "error");
          return;
        }

        const rowEl = boardEl.children[currentAttempt];
        const tiles = rowEl.querySelectorAll(".tile");

        const evalResult = evaluateGuess(rawGuess, secretWord);

        for (let i = 0; i < wordLength; i++) {
          const tile = tiles[i];
          tile.textContent = rawGuess[i];
          tile.classList.add("filled");
          tile.classList.remove("correct", "present", "miss");

          const state = evalResult[i];
          tile.classList.add(state);

          // small bounce animation
          tile.style.transform = "scale(1.08)";
          setTimeout(() => {
            tile.style.transform = "scale(1)";
          }, 120 + i * 30);
        }

        if (rawGuess === secretWord) {
          gameOver = true;
          guessInput.disabled = true;
          guessBtn.disabled = true;
          showMessage("Congratulations! You guessed the word!", "success");
          launchConfetti();
          return;
        }

        currentAttempt++;
        guessInput.value = "";

        if (currentAttempt >= MAX_ATTEMPTS) {
          gameOver = true;
          guessInput.disabled = true;
          guessBtn.disabled = true;
          showMessage(
            `Game over. The secret word was: ${secretWord}.`,
            "error"
          );
        } else {
          showMessage(
            `Attempt ${currentAttempt + 1} of ${MAX_ATTEMPTS}. Keep going!`
          );
        }
      }

      function handleWordLengthChange() {
        const newLength = parseInt(wordLengthSelect.value, 10);
        const hadActiveGame = secretWord && !gameOver;

        rebuildBoardForLength(newLength);
        secretWord = "";
        secretInput.value = "";
        currentAttempt = 0;
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        showMessage(
          hadActiveGame
            ? `Word length changed to ${wordLength}. Set a new secret word and press Play to restart.`
            : `Board updated for ${wordLength}-letter words. Type the secret word and press Play.`
        );
      }

      // 2048 HELPERS
      function set2048Message(text, type = "") {
        if (!game2048MessageEl) return;
        game2048MessageEl.textContent = text;
        game2048MessageEl.className = "message message-2048";
        if (type) {
          game2048MessageEl.classList.add(type);
        }
      }

      function applyArcadeTheme(theme) {
        const choice = theme || GAME2048_DEFAULT_THEME;
        document.body.dataset.arcadeTheme = choice;
        if (game2048ThemeSelect) {
          game2048ThemeSelect.value = choice;
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
        const size = game2048State.size;
        let moved = false;
        let gainedTotal = 0;
        const board = game2048State.board;

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
          board: cloneBoard(game2048State.board),
          score: game2048State.score,
          hasWon: game2048State.hasWon,
          keepPlaying: game2048State.keepPlaying,
          isGameOver: game2048State.isGameOver,
        };
      }

      function pushUndo(snapshot) {
        game2048State.undoStack.push(snapshot);
        if (game2048State.undoStack.length > GAME2048_MAX_UNDO) {
          game2048State.undoStack.shift();
        }
      }

      function updateUndoButton() {
        if (!game2048UndoBtn) return;
        game2048UndoBtn.disabled = game2048State.undoStack.length === 0;
      }

      function updateBestScore() {
        if (game2048State.score > game2048State.best) {
          game2048State.best = game2048State.score;
          localStorage.setItem(GAME2048_BEST_KEY, String(game2048State.best));
        }
      }

      function update2048Overlay() {
        if (!game2048Overlay) return;
        const showWin = game2048State.hasWon && !game2048State.keepPlaying;
        const showLose = game2048State.isGameOver;
        if (showWin || showLose) {
          game2048Overlay.classList.remove("hidden");
          if (showWin) {
            game2048Status.textContent = "You win!";
            game2048StatusDetail.textContent =
              "You reached 2048. Keep going or start fresh for a new record.";
            game2048KeepPlayingBtn.classList.remove("hidden");
          } else {
            game2048Status.textContent = "Game over";
            game2048StatusDetail.textContent =
              "No moves left. Start a new puzzle to keep the streak alive.";
            game2048KeepPlayingBtn.classList.add("hidden");
          }
        } else {
          game2048Overlay.classList.add("hidden");
        }
      }

      function render2048Board() {
        if (!board2048El) return;
        const size = game2048State.size;
        board2048El.innerHTML = "";
        board2048El.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        const gap =
          size >= 6 ? "8px" : size === 5 ? "10px" : "12px";
        board2048El.style.setProperty("--arcade-2048-gap", gap);
        board2048El.style.minHeight = `${size * 90}px`;

        const spawnSet = new Set(
          (game2048State.lastSpawnCells || [])
            .filter(Boolean)
            .map((cell) => `${cell.r}-${cell.c}`)
        );

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const value = game2048State.board[r][c];
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
            board2048El.appendChild(tile);
          }
        }

        if (spawnSet.size) {
          requestAnimationFrame(() => {
            game2048State.lastSpawnCells = [];
          });
        }
      }

      function update2048UI() {
        render2048Board();
        if (game2048ScoreEl) {
          game2048ScoreEl.textContent = game2048State.score;
        }
        if (game2048BestEl) {
          game2048BestEl.textContent = game2048State.best;
        }
        if (game2048SizeSelect) {
          game2048SizeSelect.value = String(game2048State.size);
        }
        updateUndoButton();
        update2048Overlay();
      }

      function triggerBoardPulse() {
        if (!board2048El) return;
        board2048El.classList.remove("board-2048--pulse");
        // force reflow to restart animation
        void board2048El.offsetWidth;
        board2048El.classList.add("board-2048--pulse");
      }

      function saveGame2048State() {
        const data = {
          size: game2048State.size,
          board: game2048State.board,
          score: game2048State.score,
          hasWon: game2048State.hasWon,
          keepPlaying: game2048State.keepPlaying,
          isGameOver: game2048State.isGameOver,
        };
        localStorage.setItem(GAME2048_STATE_KEY, JSON.stringify(data));
      }

      function restoreGame2048State(data) {
        game2048State.size = data.size || GAME2048_DEFAULT_SIZE;
        game2048State.board =
          Array.isArray(data.board) && data.board.length
            ? data.board.map((row) => row.slice())
            : createEmptyBoard(game2048State.size);
        game2048State.score = data.score || 0;
        game2048State.hasWon = Boolean(data.hasWon);
        game2048State.keepPlaying = Boolean(data.keepPlaying);
        game2048State.isGameOver = Boolean(data.isGameOver);
        game2048State.undoStack = [];
        game2048State.lastSpawnCells = [];
      }

      function startNewGame2048(size = GAME2048_DEFAULT_SIZE) {
        game2048State.size = size;
        game2048State.board = createEmptyBoard(size);
        game2048State.score = 0;
        game2048State.hasWon = false;
        game2048State.keepPlaying = false;
        game2048State.isGameOver = false;
        game2048State.undoStack = [];
        const spawnA = addRandomTile(game2048State.board);
        const spawnB = addRandomTile(game2048State.board);
        game2048State.lastSpawnCells = [spawnA, spawnB].filter(Boolean);
        update2048UI();
        set2048Message(
          `New ${size}×${size} game ready. Merge tiles to reach 2048!`
        );
        saveGame2048State();
      }

      function handle2048Move(direction) {
        if (!direction || activeView !== "game2048") return;
        if (game2048State.isGameOver) return;
        if (game2048State.hasWon && !game2048State.keepPlaying) return;

        const { moved, gained } = (() => {
          const snapshot = snapshotState();
          const result = moveBoard(direction);
          if (result.moved) {
            pushUndo(snapshot);
          }
          return result;
        })();

        if (!moved) {
          set2048Message("No tiles moved in that direction.", "error");
          return;
        }

        if (gained > 0) {
          game2048State.score += gained;
          triggerBoardPulse();
        }
        updateBestScore();

        if (!game2048State.hasWon && boardHasTarget(game2048State.board)) {
          game2048State.hasWon = true;
          game2048State.keepPlaying = false;
        }

        const prettyDir = direction.charAt(0).toUpperCase() + direction.slice(1);
        if (gained > 0) {
          set2048Message(`Merged for +${gained} (${prettyDir}).`, "success");
        } else {
          set2048Message(`${prettyDir} move executed.`);
        }

        const spawn = addRandomTile(game2048State.board);
        game2048State.lastSpawnCells = spawn ? [spawn] : [];
        game2048State.isGameOver = !canMove(game2048State.board);
        update2048UI();
        saveGame2048State();
      }

      function undo2048() {
        if (!game2048State.undoStack.length) return;
        const previous = game2048State.undoStack.pop();
        game2048State.board = previous.board;
        game2048State.score = previous.score;
        game2048State.hasWon = previous.hasWon;
        game2048State.keepPlaying = previous.keepPlaying;
        game2048State.isGameOver = previous.isGameOver;
        update2048UI();
        set2048Message("Undid your last move.");
        saveGame2048State();
      }

      function handleNewGameRequest() {
        const flat = game2048State.board.flat();
        const hasProgress = flat.some((value) => value !== 0);
        if (!hasProgress) {
          startNewGame2048(game2048State.size);
          return;
        }
        if (window.confirm("Start a new 2048 game? Current progress will be lost.")) {
          const nextSize = game2048SizeSelect
            ? parseInt(game2048SizeSelect.value, 10)
            : game2048State.size;
          startNewGame2048(nextSize);
        }
      }

      function handleSizeChange(e) {
        const newSize = parseInt(e.target.value, 10);
        startNewGame2048(newSize);
      }

      function handleThemeChange(e) {
        applyArcadeTheme(e.target.value);
      }

      function keepPlaying2048() {
        game2048State.keepPlaying = true;
        update2048UI();
        saveGame2048State();
      }

      function restart2048FromOverlay() {
        startNewGame2048(game2048State.size);
      }

      function bootstrap2048() {
        const storedBest = parseInt(localStorage.getItem(GAME2048_BEST_KEY), 10);
        if (!Number.isNaN(storedBest)) {
          game2048State.best = storedBest;
        }
        const storedTheme =
          localStorage.getItem(GAME2048_THEME_KEY) || GAME2048_DEFAULT_THEME;
        applyArcadeTheme(storedTheme);

        const saved = (() => {
          try {
            const raw = localStorage.getItem(GAME2048_STATE_KEY);
            return raw ? JSON.parse(raw) : null;
          } catch (err) {
            console.error("Failed to parse saved 2048 game", err);
            return null;
          }
        })();

        if (saved && saved.board) {
          if (window.confirm("Continue your previous 2048 game?")) {
            restoreGame2048State(saved);
            set2048Message("Continuing your saved puzzle. Good luck!");
            update2048UI();
            saveGame2048State();
            return;
          }
        }

        startNewGame2048(game2048State.size);
      }

      function handlePointerDown2048(event) {
        if (activeView !== "game2048") return;
        if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
        if (!board2048El.contains(event.target)) return;
        swipeStartPoint = { x: event.clientX, y: event.clientY };
      }

      function handlePointerUp2048(event) {
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
        handle2048Move(direction);
      }

      function handle2048Keydown(event) {
        if (activeView !== "game2048") return;
        const direction = KEY_DIRECTION_MAP[event.key];
        if (!direction) return;
        event.preventDefault();
        handle2048Move(direction);
      }

      // Events
      wordLengthSelect.addEventListener("change", handleWordLengthChange);
      startBtn.addEventListener("click", startGame);
      guessBtn.addEventListener("click", handleGuess);
      playButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const choice = btn.dataset.playGame;
          if (choice === "guess") {
            showView("guess");
          } else if (choice === "2048") {
            showView("game2048");
          }
        });
      });
      backButtons.forEach((btn) => {
        btn.addEventListener("click", () => showView("menu"));
      });

      guessInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          handleGuess();
        }
      });

      if (game2048NewBtn) {
        game2048NewBtn.addEventListener("click", handleNewGameRequest);
      }
      if (game2048UndoBtn) {
        game2048UndoBtn.addEventListener("click", undo2048);
      }
      if (game2048SizeSelect) {
        game2048SizeSelect.addEventListener("change", handleSizeChange);
      }
      if (game2048ThemeSelect) {
        game2048ThemeSelect.addEventListener("change", handleThemeChange);
      }
      if (game2048KeepPlayingBtn) {
        game2048KeepPlayingBtn.addEventListener("click", keepPlaying2048);
      }
      if (game2048RestartBtn) {
        game2048RestartBtn.addEventListener("click", restart2048FromOverlay);
      }
      if (game2048View) {
        game2048View.addEventListener("pointerdown", handlePointerDown2048);
        game2048View.addEventListener("pointerup", handlePointerUp2048);
      }
      window.addEventListener("keydown", handle2048Keydown);

      // Initial empty board for default length 5
      rebuildBoardForLength(wordLength);
      bootstrap2048();
      showView("menu");
    
