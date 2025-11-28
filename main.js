import { DataManager, SceneManager } from "./managers.js";
import { Scene_Boot } from "./scenes.js";
import { WindowManager } from "./windows.js";

/**
 * The main entry point for the game application.
 * Initializes managers and pushes the initial scene.
 * @async
 */
async function main() {
  const gameContainer = document.getElementById("game-container");
  const sceneManager = new SceneManager(gameContainer);
  const dataManager = new DataManager();
  const windowManager = new WindowManager();
  const initialScene = new Scene_Boot(dataManager, sceneManager, windowManager);
  sceneManager.push(initialScene);

  // Global Input Handler
  document.addEventListener("keydown", (e) => {
      // 1. Give WindowManager priority (for modal dialogs, closing windows)
      if (windowManager.handleInput(e)) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }

      // 2. Delegate to active scene
      const currentScene = sceneManager.currentScene();
      if (currentScene && typeof currentScene.onKeyDown === 'function') {
          currentScene.onKeyDown(e);
      }
  });

  // Expose managers to the window object for testing purposes if 'test=true' query param is present.
  if (window.location.search.includes("test=true")) {
    window.sceneManager = sceneManager;
    window.windowManager = windowManager;
    window.dataManager = dataManager;
  }
}

// Start the game when the DOM is fully loaded.
window.addEventListener("DOMContentLoaded", main);

// Theme switcher logic
const themeBtn = document.getElementById("btn-theme");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("night-theme");
  });
}
