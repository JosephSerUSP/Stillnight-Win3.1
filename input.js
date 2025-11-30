/**
 * @class InputController
 * @description Centralized input handling mapping raw keys to logical actions.
 */
export class InputController {
    constructor() {
        this.keyMap = {
            'ArrowUp': 'up',
            'w': 'up',
            'ArrowDown': 'down',
            's': 'down',
            'ArrowLeft': 'left',
            'a': 'left',
            'ArrowRight': 'right',
            'd': 'right',
            'Enter': 'ok',
            'Escape': 'cancel',
            ' ': 'ok'
        };
    }

    /**
     * Maps a keyboard event to a logical action.
     * @param {KeyboardEvent} e - The keyboard event.
     * @returns {string|null} The action identifier or null.
     */
    getAction(e) {
        return this.keyMap[e.key] || null;
    }
}
