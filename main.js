(function () {
  const menuView = document.getElementById("menuView");
  const guessView = document.getElementById("guessView");
  const game2048View = document.getElementById("game2048View");
  const stackerView = document.getElementById("stackerView");

  const playButtons = document.querySelectorAll("[data-play-game]");
  const backButtons = document.querySelectorAll("[data-back-to-menu]");

  const views = {
    menu: menuView,
    guess: guessView,
    game2048: game2048View,
    stacker: stackerView,
  };

  const guessModule = window.ArcadeGuessGame
    ? window.ArcadeGuessGame.init()
    : null;
  const game2048Module = window.Arcade2048Game
    ? window.Arcade2048Game.init()
    : null;
  const stackerModule = window.StackTowerGame
    ? window.StackTowerGame.init()
    : null;

  const modules = {
    guess: guessModule,
    game2048: game2048Module,
    stacker: stackerModule,
  };

  let activeView = "menu";

  function showView(name) {
    Object.values(views).forEach((view) => {
      if (view) view.classList.add("hidden");
    });
    const target = views[name];
    if (target) target.classList.remove("hidden");

    Object.entries(modules).forEach(([moduleName, module]) => {
      if (module && module.deactivate && moduleName !== name) {
        module.deactivate();
      }
    });
    const targetModule = modules[name];
    if (targetModule && targetModule.activate) {
      targetModule.activate();
    }

    activeView = name;
  }

  playButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.playGame;
      if (choice === "guess") {
        showView("guess");
      } else if (choice === "2048") {
        showView("game2048");
      } else if (choice === "stacker") {
        showView("stacker");
      }
    });
  });

  backButtons.forEach((btn) => {
    btn.addEventListener("click", () => showView("menu"));
  });

  showView(activeView);
})();
