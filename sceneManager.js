/**
 * @class SceneManager
 * @description Manages the scene stack and transitions.
 */
export class SceneManager {
  static _stack = [];

  /**
   * @method push
   * @description Pushes a new scene onto the stack.
   * @param {Object} scene - The scene to push.
   */
  static push(scene) {
    if (this._stack.length > 0) {
      const prev = this._stack[this._stack.length - 1];
      if (prev.onPause) prev.onPause();
    }

    this._stack.push(scene);

    // Update window.scene for tests/debugging
    if (window.location.search.includes("test=true")) {
      window.scene = scene;
    }

    if (scene.create) scene.create();
    if (scene.start) scene.start();
  }

  /**
   * @method pop
   * @description Pops the current scene from the stack.
   */
  static pop() {
    const scene = this._stack.pop();
    if (scene) {
      if (scene.stop) scene.stop();
      if (scene.destroy) scene.destroy();
    }

    if (this._stack.length > 0) {
      const next = this._stack[this._stack.length - 1];

      // Update window.scene for tests/debugging
      if (window.location.search.includes("test=true")) {
        window.scene = next;
      }

      if (next.onResume) next.onResume();
    }
  }

  /**
   * @method currentScene
   * @returns {Object} The currently active scene.
   */
  static currentScene() {
    return this._stack[this._stack.length - 1];
  }

  /**
   * @method update
   * @description Updates the current scene.
   */
  static update() {
    const scene = this.currentScene();
    if (scene && scene.update) {
      scene.update();
    }
  }
}