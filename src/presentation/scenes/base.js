/**
 * Abstract base class for presentation scenes.
 */
export class Scene_Base {
  /**
   * @param {import("../../data/content_loader.js").ContentLoader} contentLoader static content loader
   * @param {import("../windows/index.js").WindowManager} windowManager presentation window manager
   */
  constructor(contentLoader, windowManager) {
    this.contentLoader = contentLoader;
    // Compatibility property used throughout existing scene/window code.
    this.dataManager = contentLoader;
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
