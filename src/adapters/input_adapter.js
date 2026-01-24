import { InputController } from "../managers/index.js";

/**
 * Adapter for input handling to keep scenes away from manager imports.
 */
export const InputAdapter = {
    create(scene) {
        return new InputController(scene);
    }
};
