
export class InterpreterState {
    constructor() {
        this.stack = [];         // Call stack for nested sequences
        this.programCounter = 0; // Current index in the active sequence
        this.locals = {};        // Local variables for the current scope
        this.waitMode = null;    // 'input', 'time', 'animation'
        this.waitValue = 0;      // Duration or callback
        this.activeEvent = null; // The event object being processed (context)
    }

    /**
     * Resets the state for a new sequence.
     * @param {Array} sequence - List of commands.
     * @param {Object} event - The event context (optional).
     */
    start(sequence, event = null) {
        this.stack = [{ commands: sequence, pc: 0 }];
        this.activeEvent = event;
        this.waitMode = null;
    }

    get currentFrame() {
        return this.stack[this.stack.length - 1];
    }
}
