/** Abstract base class for presentation scenes. */
export class Scene_Base {
  /**
   * @param {import("../../data/content_loader.js").ContentLoader} dataManager static content loader
   * @param {import("../windows/index.js").WindowManager} windowManager presentation window manager
   */
  constructor(dataManager, windowManager) {
    this.dataManager = dataManager;
    this.windowManager = windowManager;
  }

  start() {}
  update() {}
  stop() {}
}
