/**
 * @class Scene_Base
 * @description The abstract base class for all game scenes.
 * Manages the static content and window dependencies, and defines lifecycle methods.
 */
export class Scene_Base {
  /**
   * @param {import("../../data/content_loader.js").ContentLoader} contentLoader - Static game content loader.
   * @param {import("../windows/index.js").WindowManager} windowManager - The window manager instance.
   */
  constructor(contentLoader, windowManager) {
    /** @type {import("../../data/content_loader.js").ContentLoader} */
    this.contentLoader = contentLoader;
    // Compatibility name used by existing scenes while the concrete dependency
    // is now accurately classified as ContentLoader.
    this.dataManager = contentLoader;

    /** @type {import("../windows/index.js").WindowManager} */
    this.windowManager = windowManager;
  }

  start() {
    // To be implemented by subclasses
  }

  update() {
    // To be implemented by subclasses
  }

  stop() {
    // To be implemented by subclasses
  }
}
