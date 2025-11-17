(function () {
  const MAX_ATTEMPTS = 6;

  let wordLength = 5;
  let secretWord = "";
  let currentAttempt = 0;
  let gameOver = false;

  let wordLengthSelect;
  let secretInput;
  let startBtn;
  let boardEl;
  let guessInput;
  let guessBtn;
  let messageEl;

  function cacheDom() {
    wordLengthSelect = document.getElementById("wordLength");
    secretInput = document.getElementById("secretInput");
    startBtn = document.getElementById("startBtn");
    boardEl = document.getElementById("board");
    guessInput = document.getElementById("guessInput");
    guessBtn = document.getElementById("guessBtn");
    messageEl = document.getElementById("message");
  }

  function showMessage(text, type = "") {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "message";
    if (type) messageEl.classList.add(type);
  }

  function rebuildBoardForLength(length) {
    wordLength = length;
    createBoard();
    guessInput.value = "";
    guessInput.maxLength = wordLength;
  }

  function createBoard() {
    if (!boardEl) return;
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

  function startGame() {
    const selectedLength = parseInt(wordLengthSelect.value, 10);
    let rawSecret = secretInput.value.trim().toUpperCase();

    if (!rawSecret) {
      showMessage("Enter the word you want to set as secret.", "error");
      return;
    }

    if (!/^[A-Z]+$/.test(rawSecret)) {
      showMessage("The word must contain only English letters A-Z.", "error");
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
      `Game started! Guess a ${wordLength}-letter word in ${MAX_ATTEMPTS} attempts.`
    );
  }

  function evaluateGuess(guess, secret) {
    const len = secret.length;
    const result = new Array(len).fill("miss");

    const secretChars = secret.split("");
    const used = new Array(len).fill(false);

    for (let i = 0; i < len; i++) {
      if (guess[i] === secret[i]) {
        result[i] = "correct";
        used[i] = true;
      }
    }

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
      showMessage(`Your guess must be exactly ${wordLength} letters long.`, "error");
      return;
    }
    if (!/^[A-Z]+$/.test(rawGuess)) {
      showMessage("Use only English letters A-Z.", "error");
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
      showMessage(`Game over. The secret word was: ${secretWord}.`, "error");
    } else {
      showMessage(`Attempt ${currentAttempt + 1} of ${MAX_ATTEMPTS}. Keep going!`);
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

  function init() {
    cacheDom();
    if (!boardEl) return { activate: () => {} };

    wordLengthSelect.addEventListener("change", handleWordLengthChange);
    startBtn.addEventListener("click", startGame);
    guessBtn.addEventListener("click", handleGuess);
    guessInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        handleGuess();
      }
    });

    rebuildBoardForLength(wordLength);
    return {
      activate() {
        if (!guessInput) return;
        guessInput.focus();
      },
    };
  }

  window.ArcadeGuessGame = { init };
})();
