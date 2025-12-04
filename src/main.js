import { DataManager, SceneManager, ThemeManager } from "./managers/index.js";
import { Scene_Boot, Scene_Map, Scene_Battle, Scene_Shop } from "./scenes/scenes.js";
import { WindowManager } from "./windows/index.js";

/**
 * The main entry point for the game application.
 * Initializes managers (Scene, Data, Window) and pushes the initial boot scene.
 * Sets up global input handling via the document keydown event.
 * @async
 * @returns {Promise<void>}
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
    window.Scene_Boot = Scene_Boot;
    window.Scene_Map = Scene_Map;
    window.Scene_Battle = Scene_Battle;
    window.Scene_Shop = Scene_Shop;
  }
}

// Start the game when the DOM is fully loaded.
window.addEventListener("DOMContentLoaded", main);
