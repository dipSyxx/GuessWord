(function () {
  const menuView = document.getElementById("menuView");
  const guessView = document.getElementById("guessView");
  const game2048View = document.getElementById("game2048View");
  const playButtons = document.querySelectorAll("[data-play-game]");
  const backButtons = document.querySelectorAll("[data-back-to-menu]");

  const views = {
    menu: menuView,
    guess: guessView,
    game2048: game2048View,
  };

  const guessModule = window.ArcadeGuessGame
    ? window.ArcadeGuessGame.init()
    : null;
  const game2048Module = window.Arcade2048Game
    ? window.Arcade2048Game.init()
    : null;

  let activeView = "menu";

  function showView(name) {
    Object.values(views).forEach((view) => {
      if (view) {
        view.classList.add("hidden");
      }
    });
    const target = views[name];
    if (target) {
      target.classList.remove("hidden");
    }

    if (name === "guess" && guessModule && guessModule.activate) {
      guessModule.activate();
    }
    if (game2048Module && game2048Module.deactivate) {
      game2048Module.deactivate();
    }
    if (name === "game2048" && game2048Module && game2048Module.activate) {
      game2048Module.activate();
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
      }
    });
  });

  backButtons.forEach((btn) => {
    btn.addEventListener("click", () => showView("menu"));
  });

  showView(activeView);
})();
