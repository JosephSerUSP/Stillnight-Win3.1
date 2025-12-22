import { DataManager } from "./engine/data/loader.js";
import { SceneManager } from "./presentation/managers/scene_manager.js";
import { Scene_Boot } from "./presentation/scenes/scenes.js";
import { WindowManager } from "./presentation/windows/index.js";
import { exposeGlobals } from "./debug_tools.js";

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

  // Expose managers/classes for testing
  exposeGlobals({ sceneManager, windowManager, dataManager });
}

// Start the game when the DOM is fully loaded.
window.addEventListener("DOMContentLoaded", main);
