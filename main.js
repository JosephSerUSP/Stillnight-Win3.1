import { DataManager, SceneManager } from "./managers.js";
import { Scene_Boot } from "./scenes.js";
import { WindowManager } from "./windows.js";

/**
 * The main entry point for the game.
 */
async function main() {
  const gameContainer = document.getElementById("game-container");
  const winWindow = document.querySelector(".win-window");

  const windowManager = new WindowManager();
  windowManager.attachTo(winWindow);

  const sceneManager = new SceneManager(gameContainer, windowManager);

  // Register global keydown handler for window manager
  document.addEventListener("keydown", (e) => {
      if (windowManager.handleKeyDown(e)) {
          e.preventDefault();
          e.stopImmediatePropagation();
      }
  }, true);

  const dataManager = new DataManager();
  const initialScene = new Scene_Boot(dataManager, sceneManager);
  sceneManager.push(initialScene);

  if (window.location.search.includes("test=true")) {
    window.sceneManager = sceneManager;
    window.windowManager = windowManager;
    window.dataManager = dataManager;
  }
}

// Start the game when the DOM is ready
window.addEventListener("DOMContentLoaded", main);

// Theme switcher
const themeBtn = document.getElementById("btn-theme");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("night-theme");
});
