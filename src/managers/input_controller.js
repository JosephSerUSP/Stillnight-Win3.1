/**
 * @class InputController
 * @description Handles input mapping for the map scene.
 */
export class InputController {
    /**
     * @param {import("../scenes/scenes.js").Scene_Map} scene
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Handles key down events.
     * @param {KeyboardEvent} e
     */
    onKeyDown(e) {
        if (!this.scene.runActive) return;

        // Disable movement if any modal window is open
        if (this.scene.windowManager.stack.length > 0) return;

        let dx = 0;
        let dy = 0;

        switch (e.key) {
            case "ArrowUp":
            case "w":
                dy = -1;
                break;
            case "ArrowDown":
            case "s":
                dy = 1;
                break;
            case "ArrowLeft":
            case "a":
                dx = -1;
                break;
            case "ArrowRight":
            case "d":
                dx = 1;
                break;
            default:
                return;
        }

        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            this.scene.movePlayer(dx, dy);
        }
    }
}
