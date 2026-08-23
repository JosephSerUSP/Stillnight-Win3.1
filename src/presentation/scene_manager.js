/**
 * Presentation scene stack and browser-frame lifecycle.
 * Owns presentation Scene instances, not engine runtime state.
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this._stack = [];
    this._currentScene = null;
    this.requestUpdate();
  }
  update() { if (this._currentScene) this._currentScene.update(); this.requestUpdate(); }
  requestUpdate() { requestAnimationFrame(this.update.bind(this)); }
  push(scene) { if (this._currentScene) this._stack.push(this._currentScene); this._currentScene = scene; scene.start(); }
  pop() { if (this._currentScene) this._currentScene.stop(); this._currentScene = this._stack.pop(); }
  currentScene() { return this._currentScene; }
  previous() { return this._stack[this._stack.length - 1]; }
}
