import { DataManager } from "./managers.js";
import { Scene_Map } from "./scenes.js";

/**
 * The main entry point for the game.
 */
async function main() {
  const dataManager = new DataManager();
  await dataManager.loadData();

  const scene = new Scene_Map(dataManager);
  scene.start();
}

// Start the game when the DOM is ready
window.addEventListener("DOMContentLoaded", main);
