import { WindowLayer } from "./windows.js";
import { Graphics } from "./core.js";

/**
 * @class Scene_Base
 * @description The base class for all scenes.
 */
export class Scene_Base {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   */
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.windowLayer = new WindowLayer();
  }

  /**
   * @method create
   * @description Initialize DOM elements and UI.
   */
  create() {
    const gameContainer = document.querySelector(".win-window");
    this.windowLayer.appendTo(gameContainer);
    this.createUI();
  }

  createUI() {
    // To be implemented by subclasses
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

  destroy() {
    if (this.windowLayer && this.windowLayer.element.parentNode) {
      this.windowLayer.element.parentNode.removeChild(this.windowLayer.element);
    }
  }

  onPause() {
    // Default behavior: do nothing (keep visible in background)
    // Subclasses can override to hide UI if needed
  }

  onResume() {
    // Default behavior: do nothing
  }
}