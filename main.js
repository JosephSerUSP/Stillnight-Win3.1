import { DataManager } from "./managers.js";
import { Scene_Map } from "./scenes.js";
import { SceneManager } from "./sceneManager.js";

/**
 * The main entry point for the game.
 */
async function main() {
  const dataManager = new DataManager();
  await dataManager.loadData();

  const mapScene = new Scene_Map(dataManager);

  // Push the initial scene
  SceneManager.push(mapScene);
}

// Start the game when the DOM is ready, or expose for tests
if (window.location.search.includes("test=true")) {
  window.startGame = main;
} else {
  window.addEventListener("DOMContentLoaded", main);
}

// Theme switcher
const themeBtn = document.getElementById("btn-theme");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("night-theme");
  });
}
