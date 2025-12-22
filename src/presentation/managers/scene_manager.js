/**
 * @class SceneManager
 * @description Manages the scene stack and the main game loop.
 * Scenes are pushed onto a stack, and only the top scene is updated and rendered.
 */
export class SceneManager {
  /**
   * Creates a new SceneManager.
   * @param {HTMLElement} container - The container element for the game.
   */
  constructor(container) {
    /**
     * The DOM container for the game.
     * @type {HTMLElement}
     */
    this.container = container;

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
