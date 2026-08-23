import { DataManager, SoundManager } from "./managers/index.js";
import { SettingsAdapter } from "./adapters/settings_adapter.js";
import { SceneManager } from "./presentation/scene_manager.js";
import { Scene_Boot } from "./presentation/scenes/scenes.js";
import { WindowManager } from "./presentation/windows/index.js";
import { exposeGlobals } from "./debug_tools.js";

/**
 * Application composition root.
 * Infrastructure dependencies and persistence lifecycle are explicit here.
 */
async function main() {
  SettingsAdapter.load();

  const gameContainer = document.getElementById("game-container");
  const sceneManager = new SceneManager(gameContainer);
  const dataManager = new DataManager();
  const windowManager = new WindowManager();

  SoundManager.configureSettings(SettingsAdapter);

  const initialScene = new Scene_Boot(dataManager, sceneManager, windowManager);
  sceneManager.push(initialScene);

  document.addEventListener("keydown", (e) => {
      if (windowManager.handleInput(e)) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }

      const currentScene = sceneManager.currentScene();
      if (currentScene && typeof currentScene.onKeyDown === 'function') {
          currentScene.onKeyDown(e);
      }
  });

  exposeGlobals({ sceneManager, windowManager, dataManager });
}

window.addEventListener("DOMContentLoaded", main);
