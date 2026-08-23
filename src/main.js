import { ContentLoader } from "./data/content_loader.js";
import { AudioAdapter } from "./adapters/audio_adapter.js";
import { SettingsAdapter } from "./adapters/settings_adapter.js";
import { SceneManager } from "./presentation/scene_manager.js";
import { Scene_Boot } from "./presentation/scenes/scenes.js";
import { WindowManager } from "./presentation/windows/index.js";
import { exposeGlobals } from "./debug_tools.js";

/** Application composition root. */
async function main() {
  SettingsAdapter.load();
  AudioAdapter.configureSettings(SettingsAdapter);

  const gameContainer = document.getElementById("game-container");
  const sceneManager = new SceneManager(gameContainer);
  const contentLoader = new ContentLoader();
  const windowManager = new WindowManager();

  sceneManager.push(new Scene_Boot(contentLoader, sceneManager, windowManager));

  document.addEventListener("keydown", (e) => {
    if (windowManager.handleInput(e)) { e.preventDefault(); e.stopPropagation(); return; }
    const currentScene = sceneManager.currentScene();
    if (currentScene && typeof currentScene.onKeyDown === 'function') currentScene.onKeyDown(e);
  });

  // Keep dataManager as a test-facing alias while source ownership uses ContentLoader.
  exposeGlobals({ sceneManager, windowManager, dataManager: contentLoader });
}

window.addEventListener("DOMContentLoaded", main);
