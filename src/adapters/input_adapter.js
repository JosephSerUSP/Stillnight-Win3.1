/**
 * Presentation-side input adapter for map movement.
 *
 * Input is a browser/UI concern: this adapter translates KeyboardEvents into
 * scene intent without introducing another global manager or engine dependency.
 */
class MapInputController {
    constructor(scene) {
        this.scene = scene;
    }

    onKeyDown(e) {
        if (!this.scene.runActive) return;

        // Modal presentation state owns input while a window is open.
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

        e.preventDefault();
        this.scene.movePlayer(dx, dy);
    }
}

export const InputAdapter = {
    create(scene) {
        return new MapInputController(scene);
    }
};
