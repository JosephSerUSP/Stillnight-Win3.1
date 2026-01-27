/**
 * @class Scene_Base
 * @description The abstract base class for all game scenes.
 * Manages the data and window managers, and defines the lifecycle methods.
 */
export class Scene_Base {
  /**
   * Creates a new Scene_Base.
   * @param {import("../../data/loader.js").DataManager} dataManager - The data manager instance.
   * @param {import("../windows/index.js").WindowManager} windowManager - The window manager instance.
   */
  constructor(dataManager, windowManager) {
    /**
     * The global data manager.
     * @type {import("../../data/loader.js").DataManager}
     */
    this.dataManager = dataManager;

    /**
     * The global window manager.
     * @type {import("../windows/index.js").WindowManager}
     */
    this.windowManager = windowManager;
  }

  /**
   * Starts the scene. Called when the scene is pushed onto the stack.
   * @method start
   */
  start() {
    // To be implemented by subclasses
  }

  /**
   * Updates the scene. Called every frame by the scene manager.
   * @method update
   */
  update() {
    // To be implemented by subclasses
  }

  /**
   * Stops the scene. Called when the scene is popped from the stack.
   * @method stop
   */
  stop() {
    // To be implemented by subclasses
  }
}
