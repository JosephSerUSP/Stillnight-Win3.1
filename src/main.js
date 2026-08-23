import { ContentLoader } from "./data/content_loader.js";
import { AudioAdapter } from "./adapters/audio_adapter.js";
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
  AudioAdapter.configureSettings(SettingsAdapter);

  const gameContainer = document.getElementById("game-container");
  const sceneManager = new SceneManager(gameContainer);
  const contentLoader = new ContentLoader();
  const windowManager = new WindowManager();

  const initialScene = new Scene_Boot(contentLoader, sceneManager, windowManager);
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

  // Preserve the existing test-facing alias while source ownership uses ContentLoader.
  exposeGlobals({ sceneManager, windowManager, dataManager: contentLoader });
}

window.addEventListener("DOMContentLoaded", main);
