/**
 * @class SceneManager
 * @description Manages the scene stack and the main game loop.
 * Scenes are pushed onto a stack, and only the top scene is updated and rendered.
 * Now supports Visual Transitions via TransitionManager.
 */
export class SceneManager {
  /**
   * Creates a new SceneManager.
   * @param {HTMLElement} container - The container element for the game.
   * @param {import("./transition_manager.js").TransitionManager} transitionManager - The transition manager.
   */
  constructor(container, transitionManager) {
    /**
     * The DOM container for the game.
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     * @type {import("./transition_manager.js").TransitionManager}
     */
    this.transitionManager = transitionManager;

    /**
     * The stack of active scenes.
     * @type {import("../presentation/scenes/scenes.js").Scene_Base[]}
     * @private
     */
    this._stack = [];

    /**
     * The currently active scene.
     * @type {import("../presentation/scenes/scenes.js").Scene_Base|null}
     * @private
     */
    this._currentScene = null;

    // Start the game loop
    this.requestUpdate();
  }

  /**
   * The main game loop update function.
   * Calls update() on the current scene and requests the next frame.
   * @method update
   */
  update() {
    if (this._currentScene) {
      this._currentScene.update();
    }
    this.requestUpdate();
  }

  /**
   * Requests the next animation frame for the game loop.
   * @method requestUpdate
   */
  requestUpdate() {
    requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Pushes a new scene onto the stack and starts it.
   * Pauses the previous scene.
   * @method push
   * @param {import("../presentation/scenes/scenes.js").Scene_Base} scene - The scene to push.
   */
  push(scene) {
    if (this._currentScene) {
      this._stack.push(this._currentScene);
    }
    this._currentScene = scene;
    scene.start();
  }

  /**
   * Performs a visual transition and switches to the new scene.
   * @param {import("../presentation/scenes/scenes.js").Scene_Base} scene - The new scene.
   * @param {string} type - 'BATTLE' or 'MAP'.
   */
  async switchScene(scene, type) {
      if (type === 'BATTLE') {
          // 1. Swirl Out
          if (this.transitionManager) {
              await this.transitionManager.runBattleTransition();
          }

          // 2. Switch Logic
          this.push(scene);

          // 3. Battle Intro (Reveal)
          if (this.transitionManager) {
              await this.transitionManager.runBattleIntro();
          }
      } else if (type === 'MAP') {
          // 1. Map Wipe Out
          if (this.transitionManager) {
              await this.transitionManager.runMapTransitionOut();
          }

          // 2. Switch Logic (Pop or Push, usually Map transfer is push or re-init)
          // Actually map transfer is just changing state within Scene_Map usually, or pushing new Scene_Map?
          // If called with a *new* scene instance, we push it.
          // If scene is null, we assume the caller handles the logic (e.g. map.startNewRun or same scene teleport).
          // But here we are passed a scene.

          if (scene) {
              // If popping (e.g. back to map from shop), handle differently?
              // Assuming this method is for Pushing new scenes.
              this.push(scene);
          } else {
             // If no scene passed, we assume state changed in background.
          }

          // 3. Map Wipe In
          if (this.transitionManager) {
              await this.transitionManager.runMapTransitionIn();
          }
      } else {
          this.push(scene);
      }
  }

  /**
   * Special wrapper for Map Transfers (same scene, new location).
   * @param {Function} callback - The function that updates the map state.
   */
  async executeMapTransition(callback) {
      if (this.transitionManager) {
          await this.transitionManager.runMapTransitionOut();
      }

      callback();

      // Wait a frame for render?
      await new Promise(res => requestAnimationFrame(res));

      if (this.transitionManager) {
          await this.transitionManager.runMapTransitionIn();
      }
  }

  /**
   * Pops the current scene from the stack and stops it.
   * Resumes the previous scene.
   * @method pop
   */
  pop() {
    if (this._currentScene) {
      this._currentScene.stop();
    }
    this._currentScene = this._stack.pop();
  }

  /**
   * Gets the currently active scene.
   * @method currentScene
   * @returns {import("../presentation/scenes/scenes.js").Scene_Base|null} The current scene.
   */
  currentScene() {
    return this._currentScene;
  }

  /**
   * Gets the previous scene in the stack (the one below the current scene).
   * @method previous
   * @returns {import("../presentation/scenes/scenes.js").Scene_Base|undefined} The previous scene.
   */
  previous() {
    return this._stack[this._stack.length - 1];
  }
}
