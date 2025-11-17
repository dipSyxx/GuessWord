(function () {
  const DIFFICULTY = {
    easy: { speed: 140, baseWidthRatio: 0.85 },
    normal: { speed: 190, baseWidthRatio: 0.72 },
    hard: { speed: 240, baseWidthRatio: 0.6 },
  };

  const BLOCK_COLORS = [
    "#5DD39E",
    "#FFC15E",
    "#FF6F91",
    "#6A7FDB",
    "#45B8AC",
    "#FF9671",
    "#845EC2",
  ];

  const BEST_SCORE_KEY = "stacker_best_score";
  const MIN_BLOCK_WIDTH = 6;

  const state = {
    blocks: [],
    floatingPieces: [],
    blockHeight: 22,
    activeIndex: -1,
    score: 0,
    bestScore: 0,
    difficulty: "normal",
    gameOver: false,
    running: false,
    animationId: null,
    lastTime: 0,
    canvas: null,
    ctx: null,
    stageWidth: 520,
    stageHeight: 720,
    cameraOffset: 0,
  };

  const dom = {};
  let initialized = false;

  class Block {
    constructor({ x, y, width, height, color, speed = 0, direction = 1, moving = false }) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.speed = speed;
      this.direction = direction;
      this.moving = moving;
    }
  }

  function cacheDom() {
    [
      "stackerView",
      "stackerCanvas",
      "stackerScore",
      "stackerBest",
      "stackerDifficulty",
      "stackerNewGame",
      "stackerOverlay",
      "stackerFinalScore",
      "stackerOverlayBest",
      "stackerPlayAgain",
      "stackerCloseOverlay",
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });
  }

  function loadBestScore() {
    const stored = parseInt(localStorage.getItem(BEST_SCORE_KEY), 10);
    if (!Number.isNaN(stored)) {
      state.bestScore = stored;
    }
    updateScoreboard();
  }

  function saveBestScore() {
    localStorage.setItem(BEST_SCORE_KEY, String(state.bestScore));
  }

  function updateScoreboard() {
    dom.stackerScore.textContent = state.score;
    dom.stackerBest.textContent = state.bestScore;
  }

  function resizeCanvas() {
    const stage = dom.stackerCanvas.parentElement;
    const rect = stage.getBoundingClientRect();
    const desiredWidth = Math.min(560, rect.width - 20);
    const aspect = state.stageHeight / state.stageWidth;
    dom.stackerCanvas.width = desiredWidth;
    dom.stackerCanvas.height = desiredWidth * aspect;
    state.stageWidth = dom.stackerCanvas.width;
    state.stageHeight = dom.stackerCanvas.height;
  }

  function getDifficultySettings() {
    return DIFFICULTY[state.difficulty];
  }

  function resetState() {
    state.blocks = [];
    state.floatingPieces = [];
    state.score = 0;
    state.gameOver = false;
    state.activeIndex = -1;
    state.lastTime = 0;
  }

  function createBaseBlock() {
    const settings = getDifficultySettings();
    const width = state.stageWidth * settings.baseWidthRatio;
    const x = (state.stageWidth - width) / 2;
    const y = state.stageHeight - state.blockHeight - 30;
    const baseColor = BLOCK_COLORS[0];
    const base = new Block({
      x,
      y,
      width,
      height: state.blockHeight,
      color: baseColor,
    });
    state.blocks.push(base);
  }

  function spawnMovingBlock() {
    const prev = state.blocks[state.blocks.length - 1];
    const settings = getDifficultySettings();
    const width = prev.width;
    const y = prev.y - state.blockHeight;
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -width : state.stageWidth;
    const direction = fromLeft ? 1 : -1;
    const color = BLOCK_COLORS[(state.blocks.length - 1) % BLOCK_COLORS.length];
    const block = new Block({
      x,
      y,
      width,
      height: state.blockHeight,
      color,
      speed: settings.speed,
      direction,
      moving: true,
    });
    state.blocks.push(block);
    state.activeIndex = state.blocks.length - 1;
  }

  function startGameLoop() {
    if (state.animationId) return;
    state.running = true;
    state.lastTime = performance.now();
    state.animationId = requestAnimationFrame(loop);
  }

  function stopGameLoop() {
    state.running = false;
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }
  }

  function startNewGame() {
    state.difficulty = dom.stackerDifficulty.value;
    resetState();
    createBaseBlock();
    spawnMovingBlock();
    updateScoreboard();
    hideOverlay();
    startGameLoop();
  }

  function loop(timestamp) {
    if (!state.running) return;
    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;
    update(dt);
    render();
    state.animationId = requestAnimationFrame(loop);
  }

  function update(dt) {
    if (state.gameOver) return;
    const active = state.blocks[state.activeIndex];
    if (active && active.moving) {
      active.x += active.speed * active.direction * dt;
      if (active.x <= -active.width * 0.5) {
        active.direction = 1;
      } else if (active.x + active.width >= state.stageWidth + active.width * 0.5) {
        active.direction = -1;
      }
    }
    updateFloatingPieces(dt);
  }

  function updateFloatingPieces(dt) {
    const gravity = 520;
    state.floatingPieces = state.floatingPieces.filter((piece) => piece.y < state.stageHeight + 100);
    state.floatingPieces.forEach((piece) => {
      piece.y += piece.velocityY * dt;
      piece.velocityY += gravity * dt;
      piece.rotation += piece.rotationSpeed * dt;
    });
  }

  function updateCameraOffset() {
    if (!state.blocks.length) {
      state.cameraOffset = 0;
      return;
    }
    const highestY = state.blocks.reduce((min, block) => Math.min(min, block.y), Infinity);
    const margin = 120;
    state.cameraOffset = highestY < margin ? margin - highestY : 0;
  }

  function render() {
    const ctx = state.ctx;
    ctx.clearRect(0, 0, state.stageWidth, state.stageHeight);

    const gradient = ctx.createLinearGradient(0, 0, 0, state.stageHeight);
    gradient.addColorStop(0, "#0b1230");
    gradient.addColorStop(1, "#06070f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.stageWidth, state.stageHeight);

    updateCameraOffset();
    ctx.save();
    ctx.translate(0, state.cameraOffset);

    state.blocks.forEach((block) => {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });

    state.floatingPieces.forEach((piece) => {
      ctx.save();
      ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      ctx.restore();
    });

    ctx.restore();
  }

  function placeActiveBlock() {
    if (state.gameOver) return;
    const active = state.blocks[state.activeIndex];
    const prev = state.blocks[state.activeIndex - 1];
    if (!active || !prev) return;

    const left = Math.max(prev.x, active.x);
    const right = Math.min(prev.x + prev.width, active.x + active.width);
    const overlap = right - left;

    if (overlap <= 0) {
      return endGame();
    }

    const cutoffLeft = left - active.x;
    const cutoffRight = active.x + active.width - right;

    if (cutoffLeft > 0) {
      addFloatingPiece(active.x, active.y, cutoffLeft, active.height, active.color);
    }
    if (cutoffRight > 0) {
      addFloatingPiece(right, active.y, cutoffRight, active.height, active.color);
    }

    active.x = left;
    active.width = overlap;
    active.moving = false;
    active.speed = 0;

    state.score += 1;
    const perfect = Math.abs(overlap - prev.width) < 0.5;
    if (perfect) {
      state.score += 1;
    }
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      saveBestScore();
    }
    updateScoreboard();

    if (overlap < MIN_BLOCK_WIDTH) {
      return endGame();
    }

    spawnMovingBlock();
  }

  function addFloatingPiece(x, y, width, height, color) {
    state.floatingPieces.push({
      x,
      y,
      width,
      height,
      color,
      velocityY: 0,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 8,
    });
  }

  function endGame() {
    state.gameOver = true;
    state.running = false;
    stopGameLoop();
    dom.stackerFinalScore.textContent = state.score;
    dom.stackerOverlayBest.textContent = state.bestScore;
    dom.stackerOverlay.classList.remove("hidden");
  }

  function hideOverlay() {
    dom.stackerOverlay.classList.add("hidden");
  }

  function handleInput(event) {
    if (state.gameOver) return;
    if (event.type === "keydown") {
      if (event.code !== "Space" && event.code !== "Enter") return;
      event.preventDefault();
    }
    placeActiveBlock();
  }

  function initEvents() {
    dom.stackerNewGame.addEventListener("click", startNewGame);
    dom.stackerPlayAgain.addEventListener("click", startNewGame);
    dom.stackerCloseOverlay.addEventListener("click", hideOverlay);
    dom.stackerDifficulty.addEventListener("change", () => startNewGame());
    dom.stackerCanvas.addEventListener("click", handleInput);
    dom.stackerCanvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleInput(e);
    });
    window.addEventListener("keydown", handleInput);
    window.addEventListener("resize", () => {
      resizeCanvas();
      render();
    });
  }

  function init() {
    cacheDom();
    if (!dom.stackerCanvas) {
      return { activate: () => {}, deactivate: () => {} };
    }
    state.canvas = dom.stackerCanvas;
    state.ctx = dom.stackerCanvas.getContext("2d");
    resizeCanvas();
    loadBestScore();
    initEvents();
    initialized = true;

    return {
      activate() {
        if (!initialized) return;
        if (!state.blocks.length) {
          startNewGame();
        } else if (!state.gameOver) {
          startGameLoop();
        }
      },
      deactivate() {
        stopGameLoop();
      },
    };
  }

  window.StackTowerGame = { init };
})();
