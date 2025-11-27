import { DataManager, SceneManager } from "./managers.js";
import { Scene_Boot } from "./scenes.js";

/**
 * The main entry point for the game.
 */
async function main() {
  const gameContainer = document.getElementById("game-container");
  const sceneManager = new SceneManager(gameContainer);
  const dataManager = new DataManager();
  const initialScene = new Scene_Boot(dataManager, sceneManager);
  sceneManager.push(initialScene);

  if (window.location.search.includes("test=true")) {
    window.sceneManager = sceneManager;
  }
}

// Start the game when the DOM is ready
window.addEventListener("DOMContentLoaded", main);

// Theme switcher
const themeBtn = document.getElementById("btn-theme");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("night-theme");
});
