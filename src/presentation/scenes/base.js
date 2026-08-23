/** Abstract base class for presentation scenes. */
export class Scene_Base {
  /**
   * @param {import("../../data/content_loader.js").ContentLoader} contentLoader static content loader
   * @param {import("../windows/index.js").WindowManager} windowManager presentation window manager
   */
  constructor(contentLoader, windowManager) {
    // dataManager remains a compatibility property for existing scene code while
    // its concrete owner is now accurately named and located as ContentLoader.
    this.contentLoader = contentLoader;
    this.dataManager = contentLoader;
    this.windowManager = windowManager;
  }

  start() {}
  update() {}
  stop() {}
}
