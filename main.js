import { DataManager, SceneManager } from "./managers.js";
import { Scene_Boot } from "./scenes.js";
import { WindowManager } from "./windows.js";

/**
 * The main entry point for the game.
 */
async function main() {
  const gameContainer = document.getElementById("game-container");

  // Create a dedicated container for scenes so they don't wipe the window layer
  const sceneContainer = document.createElement("div");
  sceneContainer.id = "scene-container";
  sceneContainer.style.width = "100%";
  sceneContainer.style.height = "100%";
  gameContainer.appendChild(sceneContainer);

  // Initialize WindowManager
  // It will append the window layer to gameContainer (sibling of sceneContainer)
  const windowManager = new WindowManager();
  windowManager.setup(gameContainer);

  // Make WindowManager globally available so Window_Base can access it if needed
  window.windowManager = windowManager;

  // Initialize SceneManager with the sceneContainer
  const sceneManager = new SceneManager(sceneContainer);

  // Pass windowManager to Scene_Boot (and it will pass it down)
  const dataManager = new DataManager();
  const initialScene = new Scene_Boot(dataManager, sceneManager, windowManager);
  sceneManager.push(initialScene);

  if (window.location.search.includes("test=true")) {
    window.sceneManager = sceneManager;
    window.dataManager = dataManager; // Expose dataManager for tests
  }
}

// Start the game when the DOM is ready
window.addEventListener("DOMContentLoaded", main);

// Theme switcher
const themeBtn = document.getElementById("btn-theme");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("night-theme");
});
